import os
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify
import requests
import xml.etree.ElementTree as ET
import psycopg2
import psycopg2.extras

app = Flask(__name__)

# URL del mock SOAP — lee del entorno, fallback para desarrollo local
SOAP_URL = os.getenv("SOAP_URL", "http://mock-soap:8090/soap")

# Namespaces del spec
NS_SOAP = "http://schemas.xmlsoap.org/soap/envelope/"
NS_COMP = "http://government.example.com/compliance"

# Credenciales PostgreSQL desde entorno
DB_CONFIG = {
    "host":     os.getenv("POSTGRES_HOST", "postgres"),
    "port":     os.getenv("POSTGRES_PORT", "5432"),
    "dbname":   os.getenv("POSTGRES_DB", "compliance_db"),
    "user":     os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "password"),
}


def get_db():
    """Abre una conexion a PostgreSQL."""
    return psycopg2.connect(**DB_CONFIG)


def build_soap_envelope(document_id, document_type):
    """Construye el XML SOAP que el mock espera recibir."""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="{NS_SOAP}" xmlns:comp="{NS_COMP}">
  <soapenv:Body>
    <comp:VerifyComplianceRequest>
      <comp:DocumentId>{document_id}</comp:DocumentId>
      <comp:DocumentType>{document_type}</comp:DocumentType>
    </comp:VerifyComplianceRequest>
  </soapenv:Body>
</soapenv:Envelope>"""


def parse_soap_response(xml_text):
    """
    Parsea el XML de respuesta del mock.
    Devuelve un dict con los campos, o lanza ValueError si es un SOAP Fault.
    """
    root = ET.fromstring(xml_text)
    ns = {"soapenv": NS_SOAP, "comp": NS_COMP}

    body = root.find("soapenv:Body", ns)

    # Verificar si es un Fault
    fault = body.find("soapenv:Fault", ns)
    if fault is not None:
        fault_string = fault.findtext("faultstring", default="Unknown fault")
        raise ValueError(f"SOAP Fault: {fault_string}")

    # Extraer los campos de la respuesta exitosa
    response_el = body.find("comp:VerifyComplianceResponse", ns)
    return {
        "status":     response_el.findtext("comp:Status",    default="", namespaces=ns),
        "check_id":   response_el.findtext("comp:CheckId",   default="", namespaces=ns),
        "details":    response_el.findtext("comp:Details",   default="", namespaces=ns),
        "checked_at": response_el.findtext("comp:CheckedAt", default="", namespaces=ns),
    }


def save_compliance_check(document_id, status, details, check_id):
    """Guarda el resultado de compliance en PostgreSQL."""
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO compliance_checks (id, document_id, status, details, checked_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (check_id, document_id, status, details, datetime.now(timezone.utc))
            )
        conn.commit()
    finally:
        conn.close()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/v1/compliance/check", methods=["POST"])
def compliance_check():
    data = request.get_json()

    document_id   = data.get("document_id", "unknown")
    document_type = data.get("document_type")

    if not document_type:
        return jsonify({"error": "document_type is required"}), 400

    # 1. Construir el envelope SOAP
    envelope = build_soap_envelope(document_id, document_type)

    # 2. Enviar al mock SOAP con Content-Type text/xml
    try:
        soap_resp = requests.post(
            SOAP_URL,
            data=envelope.encode("utf-8"),
            headers={"Content-Type": "text/xml; charset=utf-8"},
            timeout=10,
        )
    except requests.RequestException as e:
        return jsonify({"error": f"Could not reach SOAP server: {str(e)}"}), 502

    # 3. Parsear la respuesta XML
    try:
        result = parse_soap_response(soap_resp.text)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except ET.ParseError:
        return jsonify({"error": "Invalid XML in SOAP response"}), 502

    # 4. Guardar en PostgreSQL
    try:
        save_compliance_check(
            document_id=document_id,
            status=result["status"],
            details=result["details"],
            check_id=result["check_id"],
        )
    except Exception as e:
        app.logger.error(f"DB error: {e}")
        # No bloqueamos la respuesta si falla el guardado

    return jsonify({
        "document_id":  document_id,
        "status":       result["status"],
        "check_id":     result["check_id"],
        "details":      result["details"],
        "checked_at":   result["checked_at"],
    })


@app.route("/api/v1/compliance/status/<document_id>", methods=["GET"])
def compliance_status(document_id):
    """Devuelve el ultimo resultado de compliance para un documento."""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, document_id, status, details, checked_at
                FROM compliance_checks
                WHERE document_id = %s
                ORDER BY checked_at DESC
                LIMIT 1
                """,
                (document_id,)
            )
            row = cur.fetchone()
    finally:
        conn.close()

    if not row:
        return jsonify({"error": "No compliance check found for this document"}), 404

    return jsonify({
        "id":          str(row["id"]),
        "document_id": str(row["document_id"]),
        "status":      row["status"],
        "details":     row["details"],
        "checked_at":  row["checked_at"].isoformat() if row["checked_at"] else None,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001)