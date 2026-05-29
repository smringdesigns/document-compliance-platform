from minio import Minio
from minio.error import S3Error
from app.core.config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
)
from io import BytesIO

# Cliente MinIO — solo se conecta, no hace nada en el import
client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False,
)


def ensure_bucket():
    """
    Crea el bucket si no existe.
    Se llama una sola vez al arrancar la app, no al importar el modulo.
    """
    try:
        if not client.bucket_exists(MINIO_BUCKET):
            client.make_bucket(MINIO_BUCKET)
    except S3Error as e:
        raise RuntimeError(f"Could not initialize MinIO bucket: {e}")


def upload_file_to_minio(bucket_name: str, object_name: str, data: bytes, content_type: str = "application/octet-stream"):
    """
    Sube un archivo a MinIO.
    
    Args:
        bucket_name: Nombre del bucket
        object_name: Nombre del objeto en MinIO
        data: Contenido del archivo en bytes
        content_type: Tipo MIME del archivo
    """
    try:
        file_obj = BytesIO(data)
        client.put_object(
            bucket_name,
            object_name,
            file_obj,
            length=len(data),
            content_type=content_type,
        )
    except S3Error as e:
        raise RuntimeError(f"Could not upload file to MinIO: {e}")