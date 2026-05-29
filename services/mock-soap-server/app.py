import uuid
from datetime import datetime, timezone
from flask import Flask, request, Response
import xml.etree.ElementTree as ET

app = Flask(__name__)

# Namespaces que usa el spec
NS_SOAP = "http://schemas.xmlsoap.org/soap/envelope/"
NS_COMP = "http://government.example.com/compliance"

# Comportamiento fijo segun el spec
COMPLIANCE_RULES = {
    "financial_report":       "COMPLIANT",
    "tax_filing":             "NON_COMPLIANT",
    "regulatory_disclosure":  "COMPLIANT",
}


def soap_response(status, check_id, details, checked_at):
    """Construye el XML de respuesta SOAP exitosa."""
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="{NS_SOAP}" xmlns:comp="{NS_COMP}">
  <soapenv:Body>
    <comp:VerifyComplianceResponse>
      <comp:Status>{status}</comp:Status>
      <comp:CheckId>{check_id}</comp:CheckId>
      <comp:Details>{details}</comp:Details>
      <comp:CheckedAt>{checked_at}</comp:CheckedAt>
    </comp:VerifyComplianceResponse>
  </soapenv:Body>
</soapenv:Envelope>"""
    return Response(xml, status=200, mimetype="text/xml")


def soap_fault(message):
    """Construye el XML de SOAP Fault para tipos de documento invalidos."""
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="{NS_SOAP}">
  <soapenv:Body>
    <soapenv:Fault>
      <faultcode>soapenv:Client</faultcode>
      <faultstring>{message}</faultstring>
    </soapenv:Fault>
  </soapenv:Body>
</soapenv:Envelope>"""
    return Response(xml, status=400, mimetype="text/xml")


@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}


@app.route("/soap", methods=["POST"])
def verify_compliance():
    # 1. Parsear el XML que llega en el body
    try:
        root = ET.fromstring(request.data)
    except ET.ParseError:
        return soap_fault("Invalid XML in request body")

    # 2. Registrar namespaces para navegar el XML
    ns = {
        "soapenv": NS_SOAP,
        "comp":    NS_COMP,
    }

    # 3. Extraer DocumentId y DocumentType del envelope
    body = root.find("soapenv:Body", ns)
    if body is None:
        return soap_fault("Missing SOAP Body")

    verify_req = body.find("comp:VerifyComplianceRequest", ns)
    if verify_req is None:
        return soap_fault("Missing VerifyComplianceRequest element")

    document_id   = verify_req.findtext("comp:DocumentId", default="", namespaces=ns)
    document_type = verify_req.findtext("comp:DocumentType", default="", namespaces=ns)

    # 4. Aplicar regla de compliance
    if document_type not in COMPLIANCE_RULES:
        return soap_fault(
            f"Invalid DocumentType '{document_type}'. "
            "Allowed: financial_report, tax_filing, regulatory_disclosure"
        )

    status     = COMPLIANCE_RULES[document_type]
    check_id   = str(uuid.uuid4())
    checked_at = datetime.now(timezone.utc).isoformat()
    details    = f"Government compliance check completed for document {document_id}"

    return soap_response(status, check_id, details, checked_at)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8090)