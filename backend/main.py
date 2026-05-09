import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.base import Base
from db.session import engine

# Import all models so SQLAlchemy registers them before create_all
import models.user       # noqa: F401
import models.claims     # noqa: F401
import models.salary     # noqa: F401
import models.attendance # noqa: F401
import models.department # noqa: F401
import models.notification # noqa: F401

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

Base.metadata.create_all(bind=engine)

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
