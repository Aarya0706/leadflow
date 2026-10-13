import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("leadflow")


def _field_name(loc: tuple) -> str:
    # Drop the "body"/"query"/"path" prefix FastAPI adds; keep the field path.
    return ".".join(str(part) for part in loc[1:]) or str(loc[0])


def register_exception_handlers(app: FastAPI) -> None:
    """Every error response has the shape {"detail": "<message>"}.

    Validation errors additionally include an "errors" list of
    {"field", "message"} so the UI can show messages next to inputs.
    """

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        errors = [
            {
                "field": _field_name(err["loc"]),
                "message": err["msg"].removeprefix("Value error, "),
            }
            for err in exc.errors()
        ]
        detail = "; ".join(f"{e['field']}: {e['message']}" for e in errors)
        return JSONResponse(
            status_code=422,
            content={"detail": detail, "errors": errors},
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(_: Request, exc: Exception):
        logger.exception("Unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
