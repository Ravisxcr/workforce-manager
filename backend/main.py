import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from router import (attendance, auth, department, document, employee, leave,
                    notification, reimbursement, salary)

app = FastAPI(title="Workforce Manager API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logging.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(auth.router,           prefix="/auth",         tags=["Auth"])
app.include_router(employee.router,       prefix="/employee",     tags=["Employee"])
app.include_router(attendance.router,     prefix="/attendance",   tags=["Attendance"])
app.include_router(leave.router,          prefix="/leave",        tags=["Leave"])
app.include_router(reimbursement.router,  prefix="/reimbursement",tags=["Reimbursement"])
app.include_router(document.router,       prefix="/document",     tags=["Document"])
app.include_router(salary.router,         prefix="/salary",       tags=["Salary"])
app.include_router(department.router,     prefix="/department",   tags=["Department"])
app.include_router(notification.router,   prefix="/notification", tags=["Notification"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level=logging.DEBUG)
