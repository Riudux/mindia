<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use App\Models\Student;
use App\Models\Tutor;
use App\Models\SupportStaff;
use Illuminate\Support\Facades\Schema;


class UserController extends Controller
{
    private function ensureAdmin(Request $request)
    {
        $user = $request->user()->load('role');

        if (!$user->role || $user->role->name !== 'admin') {
            return response()->json([
                'message' => 'Access denied. Only administrators can perform this action.',
            ], 403);
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Listado de usuarios
    |--------------------------------------------------------------------------
    |
    | Este método devuelve todos los usuarios registrados en el sistema.
    | Además de los datos básicos de la tabla users, también agrega la
    | información relacionada según el rol:
    |
    | - student: datos académicos si el usuario es estudiante.
    | - tutor: datos del tutor si el usuario tiene rol tutor.
    | - support_staff: datos del personal de apoyo si aplica.
    |
    | Esto es necesario para que el frontend pueda usar los IDs reales de
    | students.id y tutors.id al crear asignaciones estudiante-tutor.
    |
    */
    public function index()
    {
        $users = User::orderBy('id', 'asc')->get();

        $usersWithProfiles = $users->map(function ($user) {
            $userData = $user->toArray();

            $userData['student'] = Student::where('user_id', $user->id)->first();
            $userData['tutor'] = Tutor::where('user_id', $user->id)->first();
            $userData['support_staff'] = SupportStaff::where('user_id', $user->id)->first();

            return $userData;
        });

        return response()->json([
            'users' => $usersWithProfiles,
        ]);
    }

    /**
 * Crea un nuevo usuario desde el panel administrativo.
 *
 * Este método registra primero los datos generales en la tabla "users".
 * Después, dependiendo del rol seleccionado, crea también el perfil específico:
 *
 * - Si el rol es "student", crea un registro en la tabla "students".
 * - Si el rol es "tutor", crea un registro en la tabla "tutors".
 * - Si el rol es "support", crea un registro en la tabla "support_staff".
 * - Si el rol es "admin", solo crea el usuario base.
 *
 * Se usa una transacción para asegurar que todo se guarde correctamente.
 * Si algo falla, Laravel cancela todos los cambios para evitar datos incompletos.
 */
    public function store(Request $request)
    {
        // Verifica que el usuario autenticado sea administrador.
        // Si no es admin, se devuelve un error 403.
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        /*
        * Validación base para cualquier tipo de usuario.
        * Estos campos pertenecen a la tabla "users".
        */
        $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20'],
            'profile_photo' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        /*
        * Se obtiene el rol seleccionado.
        * Esto permite saber si el usuario será admin, tutor, support o student.
        */
        $role = Role::findOrFail($request->role_id);

        /*
        * Validaciones específicas dependiendo del rol.
        * Ejemplo:
        * - Un estudiante necesita matrícula, carrera, grupo y semestre.
        * - Un tutor necesita departamento y clave de empleado.
        * - Personal de apoyo necesita área y clave de empleado.
        */
        if ($role->name === 'student') {
            $request->validate([
                'enrollment_key' => ['required', 'string', 'max:50', 'unique:students,enrollment_key'],
                'career' => ['required', 'string', 'max:150'],
                'group_name' => ['required', 'string', 'max:50'],
                'semester' => ['required', 'integer', 'min:1', 'max:20'],
                'academic_status' => ['nullable', 'string', 'max:50'],
            ]);
        }

        if ($role->name === 'tutor') {
            $request->validate([
                'department' => ['required', 'string', 'max:150'],
                'employee_key' => ['required', 'string', 'max:50', 'unique:tutors,employee_key'],
            ]);
        }

        if ($role->name === 'support') {
            $request->validate([
                'area' => ['required', 'string', 'max:150'],
                'employee_key' => ['required', 'string', 'max:50', 'unique:support_staff,employee_key'],
            ]);
        }

        /*
        * La transacción asegura integridad.
        * Si se crea el usuario pero falla el perfil, se revierte todo.
        */
        $user = DB::transaction(function () use ($request, $role) {
            /*
            * Creación del usuario base.
            * Esta información se guarda en la tabla "users".
            */
            $user = User::create([
                'role_id' => $request->role_id,
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'profile_photo' => $request->profile_photo,
                'status' => $request->status ?? 'active',
            ]);

            /*
            * Si el usuario creado es estudiante,
            * se crea su perfil académico en la tabla "students".
            */
            if ($role->name === 'student') {
                $user->student()->create([
                    'enrollment_key' => $request->enrollment_key,
                    'career' => $request->career,
                    'group_name' => $request->group_name,
                    'semester' => $request->semester,
                    'academic_status' => $request->academic_status ?? 'active',
                ]);
            }

            /*
            * Si el usuario creado es tutor,
            * se crea su perfil institucional en la tabla "tutors".
            */
            if ($role->name === 'tutor') {
                $user->tutor()->create([
                    'department' => $request->department,
                    'employee_key' => $request->employee_key,
                ]);
            }

            /*
            * Si el usuario creado pertenece al área de apoyo,
            * se crea su perfil en la tabla "support_staff".
            */
            if ($role->name === 'support') {
                $user->supportStaff()->create([
                    'area' => $request->area,
                    'employee_key' => $request->employee_key,
                ]);
            }

            /*
            * Se regresa el usuario creado.
            * Después se cargan sus relaciones para devolver una respuesta completa.
            */
            return $user;
        });

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user->load('role', 'student', 'tutor', 'supportStaff'),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Mostrar un usuario específico
    |--------------------------------------------------------------------------
    |
    | Este método devuelve la información general del usuario y también sus datos
    | relacionados según el rol:
    |
    | - students
    | - tutors
    | - support_staff
    |
    | Esto permite que el frontend cargue correctamente datos como matrícula,
    | carrera, cuatrimestre, grupo, área o departamento al abrir la pantalla
    | de edición.
    |
    */
    public function show(User $user)
    {
        // Convertimos el usuario a arreglo para poder agregar datos relacionados.
        $userData = $user->toArray();

        // Adjuntamos los datos del estudiante si existen.
        $userData['student'] = Student::where('user_id', $user->id)->first();

        // Adjuntamos los datos del tutor si existen.
        $userData['tutor'] = Tutor::where('user_id', $user->id)->first();

        // Adjuntamos los datos del personal de apoyo si existen.
        $userData['support_staff'] = SupportStaff::where('user_id', $user->id)->first();

        return response()->json([
            'user' => $userData,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Actualizar usuario
    |--------------------------------------------------------------------------
    |
    | Este método actualiza tanto los datos principales del usuario como los datos
    | específicos de su perfil según el rol:
    |
    | Rol estudiante:
    | - enrollment_key
    | - career
    | - semester
    | - group_name
    | - phone, si existe la columna
    |
    | Rol tutor:
    | - employee_key
    | - area
    | - department
    | - phone, si existe la columna
    |
    | Rol apoyo psicológico:
    | - employee_key
    | - area
    | - department
    | - phone, si existe la columna
    |
    | Rol administrador:
    | - datos generales del usuario
    | - area, department y phone si existen columnas relacionadas en el futuro
    |
    */
    public function update(Request $request, User $user)
    {
        // Convertimos el rol recibido a número para validar campos condicionales.
        $roleId = (int) $request->input('role_id');

        /*
        |--------------------------------------------------------------------------
        | Validación
        |--------------------------------------------------------------------------
        |
        | Validamos primero los datos generales del usuario.
        | Después validamos campos específicos según el rol.
        |
        */
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'role_id' => [
                'required',
                'integer',
                'exists:roles,id',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------
            | Campos para estudiante
            |--------------------------------------------------------------
            |
            | Estos campos se requieren únicamente cuando role_id = 4.
            |
            */
            'enrollment_key' => [
                Rule::requiredIf($roleId === 4),
                'nullable',
                'string',
                'max:100',
            ],

            'career' => [
                Rule::requiredIf($roleId === 4),
                'nullable',
                'string',
                'max:255',
            ],

            'semester' => [
                Rule::requiredIf($roleId === 4),
                'nullable',
                'integer',
                'min:0',
                'max:10',
            ],

            'group_name' => [
                Rule::requiredIf($roleId === 4),
                'nullable',
                'string',
                'in:A,B,C,D',
            ],

            /*
            |--------------------------------------------------------------
            | Campos para tutor o apoyo
            |--------------------------------------------------------------
            |
            | employee_key se requiere para tutor y personal de apoyo.
            |
            */
            'employee_key' => [
                Rule::requiredIf(in_array($roleId, [2, 3])),
                'nullable',
                'string',
                'max:100',
            ],

            'area' => [
                Rule::requiredIf(in_array($roleId, [2, 3])),
                'nullable',
                'string',
                'max:255',
            ],

            'department' => [
                Rule::requiredIf(in_array($roleId, [2, 3])),
                'nullable',
                'string',
                'max:255',
            ],

            /*
            |--------------------------------------------------------------
            | Teléfono opcional
            |--------------------------------------------------------------
            |
            | El teléfono se recibe desde el frontend, pero solo se guarda si
            | la tabla correspondiente tiene una columna llamada phone.
            |
            */
            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Transacción
        |--------------------------------------------------------------------------
        |
        | Usamos una transacción para que los cambios del usuario y su perfil se
        | guarden juntos. Si algo falla, Laravel revierte todo.
        |
        */
        return DB::transaction(function () use ($validated, $user, $roleId) {
            /*
            |--------------------------------------------------------------------------
            | Actualizar tabla users
            |--------------------------------------------------------------------------
            */
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role_id' => $validated['role_id'],
                'is_active' => $validated['is_active'],
            ]);

            /*
            |--------------------------------------------------------------------------
            | Actualizar perfil de estudiante
            |--------------------------------------------------------------------------
            |
            | Si el rol seleccionado es estudiante, actualizamos o creamos el registro
            | correspondiente en la tabla students.
            |
            */
            if ($roleId === 4) {
                $studentData = [
                    'enrollment_key' => $validated['enrollment_key'],
                    'career' => $validated['career'],
                    'semester' => $validated['semester'],
                    'group_name' => $validated['group_name'],
                ];

                // Guardamos phone solo si existe la columna en students.
                if (Schema::hasColumn('students', 'phone')) {
                    $studentData['phone'] = $validated['phone'] ?? null;
                }

                Student::updateOrCreate(
                    ['user_id' => $user->id],
                    $studentData
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Actualizar perfil de tutor
            |--------------------------------------------------------------------------
            |
            | Si el rol seleccionado es tutor, actualizamos o creamos el registro
            | correspondiente en la tabla tutors.
            |
            */
            if ($roleId === 2) {
                $tutorData = [];

                if (Schema::hasColumn('tutors', 'employee_key')) {
                    $tutorData['employee_key'] = $validated['employee_key'];
                }

                if (Schema::hasColumn('tutors', 'area')) {
                    $tutorData['area'] = $validated['area'];
                }

                if (Schema::hasColumn('tutors', 'department')) {
                    $tutorData['department'] = $validated['department'];
                }

                if (Schema::hasColumn('tutors', 'phone')) {
                    $tutorData['phone'] = $validated['phone'] ?? null;
                }

                Tutor::updateOrCreate(
                    ['user_id' => $user->id],
                    $tutorData
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Actualizar perfil de personal de apoyo
            |--------------------------------------------------------------------------
            |
            | Si el rol seleccionado es apoyo psicológico, actualizamos o creamos el
            | registro correspondiente en la tabla support_staff.
            |
            */
            if ($roleId === 3) {
                $supportData = [];

                if (Schema::hasColumn('support_staff', 'employee_key')) {
                    $supportData['employee_key'] = $validated['employee_key'];
                }

                if (Schema::hasColumn('support_staff', 'area')) {
                    $supportData['area'] = $validated['area'];
                }

                if (Schema::hasColumn('support_staff', 'department')) {
                    $supportData['department'] = $validated['department'];
                }

                if (Schema::hasColumn('support_staff', 'phone')) {
                    $supportData['phone'] = $validated['phone'] ?? null;
                }

                SupportStaff::updateOrCreate(
                    ['user_id' => $user->id],
                    $supportData
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Preparar respuesta actualizada
            |--------------------------------------------------------------------------
            |
            | Volvemos a consultar los datos relacionados para confirmar que se
            | guardaron correctamente.
            |
            */
            $updatedUser = $user->fresh()->toArray();

            $updatedUser['student'] = Student::where('user_id', $user->id)->first();
            $updatedUser['tutor'] = Tutor::where('user_id', $user->id)->first();
            $updatedUser['support_staff'] = SupportStaff::where('user_id', $user->id)->first();

            return response()->json([
                'message' => 'User updated successfully.',
                'user' => $updatedUser,
            ]);
        });
    }

    public function updateStatus(Request $request, User $user)
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $user->update([
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'User status updated successfully.',
            'user' => $user->load('role'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Listado de personal de apoyo
    |--------------------------------------------------------------------------
    |
    | Devuelve el personal de apoyo disponible para canalizaciones.
    | Este listado se usa en React para que el tutor pueda seleccionar
    | dinámicamente a quién canalizar un caso.
    |
    */
    public function supportStaffOptions()
    {
        $supportStaff = SupportStaff::with('user')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($staff) {
                return [
                    'id' => $staff->id,
                    'user_id' => $staff->user_id,
                    'name' => $staff->user->name ?? 'Personal de apoyo',
                    'email' => $staff->user->email ?? 'Sin correo',
                    'employee_key' => $staff->employee_key ?? null,
                    'area' => $staff->area ?? null,
                    'department' => $staff->department ?? null,
                    'is_active' => $staff->user->is_active ?? true,
                ];
            })
            ->filter(function ($staff) {
                return $staff['is_active'] === true;
            })
            ->values();

        return response()->json([
            'support_staff' => $supportStaff,
        ]);
    }
}