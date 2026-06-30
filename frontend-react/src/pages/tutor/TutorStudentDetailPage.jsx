import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Brain,
  CalendarDays,
  ClipboardList,
  RefreshCw,
  ShieldAlert,
  UserRound,
  Zap,
} from "lucide-react";

import {
  generateTutorStudentAlertRequest,
  getTutorStudentEmotionalRecordsRequest,
  getTutorStudentEmotionalTrendsRequest,
  getTutorStudentRiskSummaryRequest,
  getTutorStudentsRequest,
} from "../../api/tutorApi";

import "../../styles/pages/tutor/TutorStudentDetailPage.css";

/*
  Pantalla de detalle del estudiante.

  Esta vista permite que el tutor consulte información individual
  del estudiante asignado:
  - Datos académicos.
  - Registros emocionales.
  - Tendencias.
  - Resumen de riesgo institucional.
  - Generación de alerta.

  Importante:
  La información mostrada se interpreta como indicador de seguimiento
  institucional, no como diagnóstico clínico.
*/
const TutorStudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [trends, setTrends] = useState([]);
  const [riskSummary, setRiskSummary] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAlert, setIsGeneratingAlert] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    Extrae listas desde distintas estructuras posibles del backend.
  */
  const extractList = (response, possibleKeys = []) => {
    if (Array.isArray(response)) {
      return response;
    }

    for (const key of possibleKeys) {
      if (Array.isArray(response?.[key])) {
        return response[key];
      }
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  };

  /*
    Normaliza estudiantes.

    El backend puede regresar directamente estudiantes o asignaciones:
    - { id, user, career }
    - { id, student: { id, user, career } }
  */
  const normalizeStudent = (item) => {
    return item?.student || item;
  };

  /*
    Obtiene el nombre del estudiante.
  */
  const getStudentName = (studentData) => {
    return (
      studentData?.user?.name ||
      studentData?.name ||
      studentData?.student_name ||
      "Estudiante sin nombre"
    );
  };

  /*
    Obtiene el correo del estudiante.
  */
  const getStudentEmail = (studentData) => {
    return (
      studentData?.user?.email ||
      studentData?.email ||
      studentData?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene la matrícula del estudiante.
  */
  const getStudentEnrollment = (studentData) => {
    return (
      studentData?.enrollment_key ||
      studentData?.institutional_id ||
      studentData?.student_code ||
      "Sin matrícula"
    );
  };

  /*
    Obtiene el programa académico.
  */
  const getStudentCareer = (studentData) => {
    return studentData?.career || studentData?.program || "Sin programa";
  };

  /*
    Obtiene el cuatrimestre.
  */
  const getStudentSemester = (studentData) => {
    if (studentData?.semester === 0 || studentData?.semester) {
      return studentData.semester;
    }

    return "N/A";
  };

  /*
    Obtiene el grupo académico.
  */
  const getStudentGroup = (studentData) => {
    return studentData?.group_name || studentData?.group || "N/A";
  };

    /*
    Obtiene el ID real del estudiante.

    Esto permite comparar correctamente el ID recibido en la URL
    contra distintas estructuras posibles del backend.
    */
    const getStudentDetailId = (studentData) => {
    return (
        studentData?.detail_id ||
        studentData?.student_id ||
        studentData?.student?.id ||
        studentData?.id ||
        null
    );
    };

  /*
    Obtiene el nombre de la emoción registrada.
  */
  const getRecordEmotionName = (record) => {
    return (
      record?.emotion?.name ||
      record?.emotion_name ||
      record?.emotion ||
      "Sin emoción"
    );
  };

  /*
    Obtiene la categoría o evento relacionado al registro.
  */
  const getRecordCategoryName = (record) => {
    return (
      record?.event_category?.name ||
      record?.category?.name ||
      record?.event_category_name ||
      record?.category ||
      "Sin categoría"
    );
  };

  /*
    Obtiene la intensidad del registro emocional.
  */
  const getRecordIntensity = (record) => {
    return record?.intensity || record?.intensity_level || record?.level || "N/A";
  };

  /*
    Obtiene la fecha del registro emocional.
  */
  const getRecordDate = (record) => {
    const rawDate =
      record?.record_date ||
      record?.recorded_date ||
      record?.created_at ||
      record?.date;

    if (!rawDate) {
      return "Sin fecha";
    }

    return new Date(rawDate).toLocaleDateString("es-MX");
  };

  /*
    Obtiene una nota o descripción del registro.
  */
  const getRecordNotes = (record) => {
    return record?.notes || record?.description || record?.comment || "Sin notas";
  };

  /*
    Obtiene el objeto de riesgo institucional desde distintas estructuras posibles.

    El backend puede responder algo como:
    {
        risk: {
        level: "...",
        score: 0,
        label: "...",
        message: "...",
        is_diagnostic: false
        }
    }

    Por eso no debemos pintar riskSummary.risk directamente en JSX,
    porque es un objeto y React no puede renderizar objetos como texto.
    */
    const getRiskData = () => {
    return (
        riskSummary?.risk ||
        riskSummary?.summary?.risk ||
        riskSummary?.summary ||
        riskSummary ||
        {}
    );
    };

    /*
    Obtiene el nivel de riesgo como texto.

    Siempre regresa string para evitar errores de React al renderizar.
    */
    const getRiskLevel = () => {
    const riskData = getRiskData();

    const level =
        riskData?.label ||
        riskData?.level ||
        riskSummary?.risk_level ||
        riskSummary?.level ||
        riskSummary?.summary?.risk_level ||
        "Sin datos";

    return String(level);
    };

    /*
    Traduce el nivel de riesgo institucional a español para mostrarlo
    en pantalla.

    El backend puede mandar valores como:
    - Indicador de riesgo alto
    - Indicador de riesgo medio
    - Indicador de riesgo bajo
    - high, medium, low
    */
    const getRiskLevelLabel = () => {
    const rawLevel = getRiskLevel();
    const level = rawLevel.trim().toLowerCase();

    if (
        level.includes("critical") ||
        level.includes("crítico") ||
        level.includes("critico")
    ) {
        return "Indicador crítico de seguimiento";
    }

    if (level.includes("high") || level.includes("alto")) {
        return "Indicador de riesgo alto";
    }

    if (
        level.includes("medium") ||
        level.includes("medio") ||
        level.includes("moderate") ||
        level.includes("moderado")
    ) {
        return "Indicador de riesgo medio";
    }

    if (level.includes("low") || level.includes("bajo")) {
        return "Indicador de riesgo bajo";
    }

    if (level.includes("normal")) {
        return "Indicador de seguimiento normal";
    }

    return rawLevel;
    };

    /*
    Traduce recomendaciones comunes que puedan llegar en inglés desde
    el backend o desde reglas internas de análisis.
    */
    const getRiskRecommendationLabel = () => {
    const recommendation = getRiskRecommendation();
    const normalizedRecommendation = recommendation.trim().toLowerCase();

    if (
        normalizedRecommendation.includes("repeated or intense emotional signals") ||
        normalizedRecommendation.includes("require prompt tutor follow-up")
    ) {
        return "El estudiante muestra señales emocionales repetidas o intensas que pueden requerir seguimiento oportuno por parte del tutor.";
    }

    if (
        normalizedRecommendation.includes("no recommendation") ||
        normalizedRecommendation.includes("without recommendation")
    ) {
        return "Sin recomendación registrada.";
    }

    return recommendation;
    };


    /*
    Obtiene el puntaje de riesgo si existe.

    Siempre regresa texto o número simple, nunca un objeto.
    */
    const getRiskScore = () => {
    const riskData = getRiskData();

    const score =
        riskData?.score ||
        riskData?.risk_score ||
        riskSummary?.risk_score ||
        riskSummary?.score ||
        riskSummary?.summary?.risk_score ||
        "N/A";

    return score;
    };

    /*
    Obtiene la recomendación institucional si existe.

    Siempre regresa string para que React pueda mostrarlo sin errores.
    */
    const getRiskRecommendation = () => {
    const riskData = getRiskData();

    const recommendation =
        riskData?.message ||
        riskData?.recommendation ||
        riskSummary?.recommendation ||
        riskSummary?.message ||
        riskSummary?.summary?.recommendation ||
        "Sin recomendación registrada.";

    return String(recommendation);
    };

    /*
    Traduce visualmente el nivel de riesgo institucional.

    Usa el campo level cuando existe, porque label puede venir como texto
    más descriptivo.
    */
    const getRiskBadgeClass = () => {
    const riskData = getRiskData();

    const risk = String(
        riskData?.level ||
        riskData?.label ||
        getRiskLevel()
    ).toLowerCase();

    if (
        risk.includes("high") ||
        risk.includes("alto") ||
        risk.includes("critical") ||
        risk.includes("crítico")
    ) {
        return "badge red";
    }

    if (
        risk.includes("medium") ||
        risk.includes("medio") ||
        risk.includes("moderate") ||
        risk.includes("moderado")
    ) {
        return "badge orange";
    }

    if (
        risk.includes("low") ||
        risk.includes("bajo") ||
        risk.includes("normal")
    ) {
        return "badge green";
    }

    return "badge";
    };

  /*
    Carga toda la información del detalle del estudiante.
  */
  const loadStudentDetail = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const [
        studentsResponse,
        recordsResponse,
        trendsResponse,
        riskResponse,
      ] = await Promise.all([
        getTutorStudentsRequest(),
        getTutorStudentEmotionalRecordsRequest(id),
        getTutorStudentEmotionalTrendsRequest(id),
        getTutorStudentRiskSummaryRequest(id),
      ]);
      const rawStudents = extractList(studentsResponse, [
        "students",
        "assigned_students",
        "assignments",
      ]);

        const normalizedStudents = rawStudents.map((item) => normalizeStudent(item));

        const selectedStudent = normalizedStudents.find((studentItem) => {
        return String(getStudentDetailId(studentItem)) === String(id);
        });

        /*
        Si el estudiante no se encuentra en GET /api/tutor/students,
        usamos como respaldo el objeto student que ya viene en los endpoints
        de registros, tendencias o riesgo.
        */
        const fallbackStudent =
        recordsResponse?.student ||
        trendsResponse?.student ||
        riskResponse?.student ||
        null;

      const recordsList = extractList(recordsResponse, [
        "records",
        "emotional_records",
        "data",
      ]);

      const trendsList = extractList(trendsResponse, [
        "trends",
        "emotional_trends",
        "data",
      ]);

      setStudent(selectedStudent || fallbackStudent);
      setRecords(recordsList);
      setTrends(trendsList);
      setRiskSummary(riskResponse);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo cargar el detalle del estudiante.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando detalle del estudiante:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
    Carga inicial.
  */
  useEffect(() => {
    loadStudentDetail();
  }, [id]);

  /*
    Cuenta registros por emoción para mostrar un resumen rápido.
  */
  const emotionSummary = useMemo(() => {
    const summary = {};

    records.forEach((record) => {
      const emotionName = getRecordEmotionName(record);
      summary[emotionName] = (summary[emotionName] || 0) + 1;
    });

    return Object.entries(summary).map(([emotionName, total]) => ({
      emotionName,
      total,
    }));
  }, [records]);

  /*
    Obtiene los últimos cinco registros para la tabla principal.
  */
  const latestRecords = useMemo(() => {
    return [...records].slice(0, 5);
  }, [records]);

  /*
    Genera una alerta institucional desde el backend.
  */
  const handleGenerateAlert = async () => {
    try {
      setIsGeneratingAlert(true);
      setErrorMessage("");
      setSuccessMessage("");

      await generateTutorStudentAlertRequest(id);

      setSuccessMessage("Alerta institucional generada correctamente.");

      await loadStudentDetail();
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo generar la alerta institucional.";

      setErrorMessage(backendMessage);

      console.error(
        "Error generando alerta:",
        error.response?.data || error.message
      );
    } finally {
      setIsGeneratingAlert(false);
    }
  };

  /*
    Estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Tutor / Mis estudiantes / Detalle</p>
          <h2>Detalle del estudiante</h2>
          <p>Cargando información individual del estudiante...</p>
        </div>

        <div className="panel-card">
          <div className="placeholder-box">Cargando información...</div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header-with-actions page-header">
        <div>
          <p className="breadcrumb">Tutor / Mis estudiantes / Detalle</p>
          <h2>{student ? getStudentName(student) : "Detalle del estudiante"}</h2>
          <p>
            Consulta registros emocionales, tendencias y resumen de seguimiento
            institucional.
          </p>
        </div>

        <div className="student-detail-header-actions">
          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate("/tutor/students")}
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <button
            type="button"
            className="secondary-action-button"
            onClick={loadStudentDetail}
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>
      </div>

      {errorMessage && <div className="form-alert error">{errorMessage}</div>}

      {successMessage && (
        <div className="form-alert success">{successMessage}</div>
      )}

      {!student && (
        <div className="form-alert error">
          No se encontró el estudiante dentro de tus asignaciones.
        </div>
      )}

      {student && (
        <>
          <div className="student-profile-card panel-card">
            <div className="student-profile-avatar">
              <UserRound size={34} />
            </div>

            <div className="student-profile-info">
              <h3>{getStudentName(student)}</h3>
              <p>{getStudentEmail(student)}</p>

              <div className="student-profile-tags">
                <span>{getStudentEnrollment(student)}</span>
                <span>{getStudentCareer(student)}</span>
                <span>{getStudentSemester(student)}° cuatrimestre</span>
                <span>Grupo {getStudentGroup(student)}</span>
              </div>
            </div>

            <button
              type="button"
              className="primary-action-button"
              onClick={handleGenerateAlert}
              disabled={isGeneratingAlert}
            >
              <ShieldAlert size={18} />
              {isGeneratingAlert ? "Generando..." : "Generar alerta"}
            </button>
          </div>

          <div className="metrics-grid">
            <article className="metric-card">
              <div className="metric-icon blue">
                <ClipboardList size={28} />
              </div>

              <div>
                <span>Registros</span>
                <h3>{records.length}</h3>
                <small>Historial emocional</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon purple">
                <BarChart3 size={28} />
              </div>

              <div>
                <span>Tendencias</span>
                <h3>{trends.length}</h3>
                <small>Indicadores detectados</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon orange">
                <Zap size={28} />
              </div>

              <div>
                <span>Puntaje</span>
                <h3>{getRiskScore()}</h3>
                <small>Riesgo institucional</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon green">
                <Brain size={28} />
              </div>

              <div>
                <span>Nivel</span>
                <h3 className="risk-level-title">{getRiskLevelLabel()}</h3>
                <small>Seguimiento sugerido</small>
              </div>
            </article>
          </div>

          <div className="student-detail-grid">
            <div className="panel-card">
              <div className="table-header">
                <div>
                  <h3>Últimos registros emocionales</h3>
                  <p>Historial reciente capturado por el estudiante.</p>
                </div>
              </div>

              {latestRecords.length === 0 ? (
                <div className="empty-summary">
                  No hay registros emocionales disponibles.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Emoción</th>
                        <th>Categoría</th>
                        <th>Intensidad</th>
                        <th>Notas</th>
                      </tr>
                    </thead>

                    <tbody>
                      {latestRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{getRecordDate(record)}</td>
                          <td>
                            <span className="badge light-blue">
                              {getRecordEmotionName(record)}
                            </span>
                          </td>
                          <td>{getRecordCategoryName(record)}</td>
                          <td>{getRecordIntensity(record)}</td>
                          <td>{getRecordNotes(record)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="panel-card student-risk-card">
              <h3>Resumen de riesgo institucional</h3>
              <p>
                Indicador de apoyo para seguimiento académico y canalización.
              </p>

              <div className="student-risk-main">
                <AlertTriangle size={28} />
                <div>
                  <span>Nivel actual</span>
                  <strong className={getRiskBadgeClass()}>
                    {getRiskLevelLabel()}
                  </strong>
                </div>
              </div>

              <div className="student-risk-recommendation">
                <strong>Recomendación:</strong>
                <p>{getRiskRecommendationLabel()}</p>
              </div>

              <div className="info-box">
                Este resumen no representa un diagnóstico. Solo es un indicador
                institucional para priorizar seguimiento.
              </div>
            </aside>
          </div>

          <div className="student-detail-grid secondary-grid">
            <div className="panel-card">
              <h3>Resumen por emoción</h3>
              <p>Conteo de emociones registradas en el historial.</p>

              {emotionSummary.length === 0 ? (
                <div className="empty-summary">
                  No hay información suficiente para mostrar resumen.
                </div>
              ) : (
                <div className="emotion-summary-list">
                  {emotionSummary.map((item) => (
                    <div className="emotion-summary-row" key={item.emotionName}>
                      <span>{item.emotionName}</span>
                      <strong>{item.total}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel-card">
              <h3>Tendencias emocionales</h3>
              <p>Datos agregados obtenidos desde el backend.</p>

              {trends.length === 0 ? (
                <div className="empty-summary">
                  No hay tendencias disponibles.
                </div>
              ) : (
                <div className="trend-list">
                  {trends.map((trend, index) => (
                    <div className="trend-item" key={trend.id || index}>
                      <CalendarDays size={18} />
                      <div>
                        <strong>
                          {trend?.label ||
                            trend?.emotion ||
                            trend?.emotion_name ||
                            `Tendencia ${index + 1}`}
                        </strong>
                        <span>
                          {trend?.value ||
                            trend?.total ||
                            trend?.count ||
                            trend?.description ||
                            "Sin valor"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default TutorStudentDetailPage;
