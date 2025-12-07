import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.base import Base
from db.session import engine
from router import auth, document, employee, leave, reimbursement, salary

app = FastAPI()

# Allow all CORS (all origins, methods, headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(salary.router, prefix="/admin", tags=["salary"])
app.include_router(leave.router, prefix="/leave", tags=["leave"])
app.include_router(employee.router, prefix="/employee", tags=["employee"])
app.include_router(
    reimbursement.router, prefix="/reimbursement", tags=["Reimbursement"]
)
app.include_router(document.router, prefix="/document", tags=["Document Verification"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app", host="0.0.0.0", port=8000, reload=True, log_level=logging.DEBUG
    )
