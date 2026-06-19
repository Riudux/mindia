<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

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

    public function index(Request $request)
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $users = User::with('role')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                        ->orWhere('email', 'ILIKE', "%{$search}%")
                        ->orWhere('phone', 'ILIKE', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->role, function ($query, $role) {
                $query->whereHas('role', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'users' => $users,
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

    public function show(Request $request, User $user)
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        return response()->json([
            'user' => $user->load('role', 'student', 'tutor', 'supportStaff'),
        ]);
    }

    public function update(Request $request, User $user)
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $request->validate([
            'role_id' => ['sometimes', 'exists:roles,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20'],
            'profile_photo' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        $data = $request->only([
            'role_id',
            'name',
            'email',
            'phone',
            'profile_photo',
            'status',
        ]);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user->load('role'),
        ]);
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
}