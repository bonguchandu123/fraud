from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import numpy as np
import pandas as pd
import io
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, f1_score, classification_report, confusion_matrix
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
import pennylane as qml
from pennylane import numpy as qnp
import pickle
import json
from typing import List, Optional, Dict, Any
import time
import asyncio
import nest_asyncio
import uvicorn
from pyngrok import ngrok
from sklearn.metrics import roc_auc_score, f1_score, precision_recall_fscore_support, classification_report
import jwt
from datetime import datetime, timedelta
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId
from contextlib import asynccontextmanager

MONGODB_URL = ""
client = AsyncIOMotorClient(MONGODB_URL)
db = client.fraud_detection

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer(auto_error=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
   
    print("🚀 Starting Fraud Detection API...")
    yield
   
    await client.close()
    print("👋 Shutting down API...")

app = FastAPI(
    title="Quantum Fraud Detection API",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


quantum_model = None
scaler_quantum = None
classical_models = {}
scaler_classical = None

creditcard_quantum_model = None
creditcard_scaler_quantum = None
creditcard_classical_models = {}
creditcard_scaler_classical = None
creditcard_data = None

n_qubits = 4
dev = qml.device("default.qubit", wires=n_qubits)

def feature_map(x):
    for i in range(n_qubits):
        qml.RY(x[i], wires=i)
    for i in range(n_qubits-1):
        qml.CNOT(wires=[i, i+1])

def ansatz(weights):
    for i in range(n_qubits):
        qml.RY(weights[i], wires=i)
        qml.RZ(weights[i+n_qubits], wires=i)

@qml.qnode(dev, interface="autograd")
def circuit(x, weights):
    feature_map(x)
    ansatz(weights)
    return qml.expval(qml.PauliZ(0))

def predict_batch(W, Xb):
    outs = []
    for x in Xb:
        z = circuit(x, W)
        p = 0.5 * (1 + z)
        outs.append(qnp.clip(p, 1e-7, 1-1e-7))
    return qnp.stack(outs)

def bce_loss(W, Xb, yb):
    p = predict_batch(W, Xb)
    return -qnp.mean(yb*qnp.log(p) + (1-yb)*qnp.log(1-p))
def make_toy_fraud(n=1200, seed=42):
    rng = np.random.default_rng(seed)
    n0 = int(n*0.9)
   
    X0 = rng.normal(loc=[0.3,0.4,0.4,0.3], scale=[0.2,0.2,0.2,0.2], size=(n0,4))
    y0 = np.zeros(n0)
    n1 = n - n0
    X1 = rng.normal(loc=[0.6,0.7,0.7,0.6], scale=[0.2,0.2,0.2,0.2], size=(n1,4))
    y1 = np.ones(n1)
    X = np.vstack([X0, X1])
    y = np.concatenate([y0, y1])
    X = np.clip(X, 0, 1)
    return X, y.astype(int)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    print(f"DEBUG: credentials received: {credentials}")

    if not credentials:
        print("DEBUG: No credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
      
        token = credentials.credentials
        print(f"DEBUG: Raw token: {token[:50]}..." if len(token) > 50 else f"DEBUG: Raw token: {token}")

        
        if token.startswith("Bearer "):
            token = token[7:]
            print("DEBUG: Removed Bearer prefix")

        print(f"DEBUG: Processing token: {token[:50]}..." if len(token) > 50 else f"DEBUG: Processing token: {token}")

    
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DEBUG: JWT payload: {payload}")

        username: str = payload.get("sub")
        if username is None:
            print("DEBUG: No username in token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no username found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        print(f"DEBUG: Token verified successfully for user: {username}")
        return username

    except jwt.ExpiredSignatureError:
        print("DEBUG: Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        print(f"DEBUG: Invalid token error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"DEBUG: Unexpected error in token verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str
class PasswordGenerateRequest(BaseModel):
    length: int = 12
    include_special: bool = True

class TransactionInput(BaseModel):
    amount: float
    hour: int
    device: str
    merchant_risk: float
    merchant_category: str
    transaction_type: str
    cardholder_age: int

class CreditCardInput(BaseModel):
    V1: float
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float
    Time: float
    Amount: float

class TrainingConfig(BaseModel):
    epochs: int = 20
    batch_size: int = 64
    stepsize: float = 0.2
    seed: int = 123

class PredictionResponse(BaseModel):
    quantum_prediction: float
    classical_rf_prediction: float
    classical_lr_prediction: float
    hybrid_prediction: float
    is_fraud: bool

class CreditCardPredictionResponse(BaseModel):
    quantum_prediction: float
    classical_rf_prediction: float
    classical_lr_prediction: float
    hybrid_prediction: float
    is_fraud: bool
    confidence: float

class TrainingResponse(BaseModel):
    success: bool
    message: str
    metrics: dict

class AnalyticsResponse(BaseModel):
    model_performance: dict
    feature_importance: dict
    confusion_matrix: List[List[int]]

class SavedPrediction(BaseModel):
    prediction_type: str
    input_data: dict
    result: dict
    timestamp: datetime

class SavePredictionRequest(BaseModel):
    prediction_type: str
    input_data: dict
    result: dict


@app.post("/register")
async def register_user(user: UserRegister):
    try:
       
        existing_user = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

        user_doc = {
            "username": user.username,
            "email": user.email,
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }

        result = await db.users.insert_one(user_doc)

        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": str(result.inserted_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login_user(user: UserLogin):
    try:
        
        db_user = await db.users.find_one({"username": user.username})
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid username or password")

   
        if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")

      
        access_token = create_access_token(data={"sub": user.username})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "username": user.username
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def generate_quantum_password(length=12, include_special=True):
    """Generate a quantum-inspired password using quantum random number generation"""
    import string
    import numpy as np

    try:
        # Create quantum device with shots for sampling
        rng_dev = qml.device("default.qubit", wires=1, shots=100)

        @qml.qnode(rng_dev)
        def quantum_rng():
            qml.Hadamard(wires=0)
            return qml.sample(qml.PauliZ(0))


        quantum_bits = []
        for _ in range(length * 4): 
            samples = quantum_rng()
            
            bit = 1 if np.mean(samples) > 0 else 0
            quantum_bits.append(bit)

        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        special = "!@#$%&*" if include_special else ""
        all_chars = lowercase + uppercase + digits + special

       
        password = []

        if length >= 4:
           
            password.append(lowercase[sum(quantum_bits[0:4]) % len(lowercase)])
            password.append(uppercase[sum(quantum_bits[4:8]) % len(uppercase)])
            password.append(digits[sum(quantum_bits[8:12]) % len(digits)])
            if include_special and special:
                password.append(special[sum(quantum_bits[12:16]) % len(special)])

       
        start_idx = len(password)
        for i in range(start_idx, length):
            bit_group = quantum_bits[(i*4):(i*4+4)]
            char_index = sum(bit * (2**j) for j, bit in enumerate(bit_group)) % len(all_chars)
            password.append(all_chars[char_index])

        for i in range(len(password)):
            j_bits = quantum_bits[(i*2):(i*2+2)] if (i*2+2) < len(quantum_bits) else [0, 1]
            j = sum(bit * (2**k) for k, bit in enumerate(j_bits)) % len(password)
            password[i], password[j] = password[j], password[i]

        return ''.join(password)

    except Exception as e:
        print(f"Quantum generation failed: {e}, using secure fallback")
        
        import secrets
        chars = string.ascii_letters + string.digits
        if include_special:
            chars += "!@#$%&*"

        password = []
        if length >= 4:
            password.append(secrets.choice(string.ascii_lowercase))
            password.append(secrets.choice(string.ascii_uppercase))
            password.append(secrets.choice(string.digits))
            if include_special:
                password.append(secrets.choice("!@#$%&*"))

        for _ in range(len(password), length):
            password.append(secrets.choice(chars))

        # Shuffle
        for i in range(len(password)):
            j = secrets.randbelow(len(password))
            password[i], password[j] = password[j], password[i]

        return ''.join(password)

@app.get("/verify-token")
async def test_token_verification(username: str = Depends(verify_token)):
    return {"message": f"Token is valid for user: {username}", "success": True}

@app.get("/test-no-auth")
async def test_no_auth():
    return {"message": "This endpoint works without authentication", "success": True}


@app.get("/")
async def root():
    return {"message": "Quantum Fraud Detection API v2.0 is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "quantum_device": str(dev)}

@app.post("/generate-quantum-password")
async def generate_password(request: PasswordGenerateRequest):
    try:
        if request.length < 6 or request.length > 50:
            raise HTTPException(status_code=400, detail="Password length must be between 6 and 50 characters")

        password = generate_quantum_password(
            length=request.length,
            include_special=request.include_special
        )

        # Calculate password strength
        strength_score = 0
        if len(password) >= 8:
            strength_score += 1
        if any(c.isupper() for c in password):
            strength_score += 1
        if any(c.islower() for c in password):
            strength_score += 1
        if any(c.isdigit() for c in password):
            strength_score += 1
        if any(c in "!@#$%&*" for c in password):
            strength_score += 1

        strength_levels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"]
        strength = strength_levels[min(strength_score, 5)]

        return {
            "success": True,
            "password": password,
            "strength": strength,
            "length": len(password),
            "has_uppercase": any(c.isupper() for c in password),
            "has_lowercase": any(c.islower() for c in password),
            "has_numbers": any(c.isdigit() for c in password),
            "has_special": any(c in "!@#$%&*" for c in password)
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Password generation failed: {str(e)}"
        }

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))

        # Validate required columns
        required_cols = ["amount", "time", "device", "merchant_risk", "label",
                        "merchant_category", "transaction_type", "cardholder_age"]
        missing_cols = [col for col in required_cols if col.lower() not in [c.lower() for c in df.columns]]

        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")

        return {
            "success": True,
            "message": f"CSV uploaded successfully with {len(df)} rows",
            "preview": df.head().to_dict('records'),
            "columns": df.columns.tolist(),
            "shape": df.shape
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Credit Card Dataset Routes
@app.post("/upload-creditcard-csv")
async def upload_creditcard_csv(file: UploadFile = File(...)):
    global creditcard_data
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))

        # Validate credit card dataset columns
        required_cols = ['Time', 'Amount', 'Class'] + [f'V{i}' for i in range(1, 29)]
        missing_cols = [col for col in required_cols if col not in df.columns]

        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns for credit card dataset: {missing_cols}")

        creditcard_data = df

        return {
            "success": True,
            "message": f"Credit card CSV uploaded successfully with {len(df)} rows",
            "fraud_count": int(df['Class'].sum()),
            "legitimate_count": int((df['Class'] == 0).sum()),
            "fraud_percentage": float(df['Class'].mean() * 100),
            "shape": df.shape
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

DEFAULT_CREDITCARD_CSV = "./creditcard.csv"

@app.post("/train-creditcard-quantum", response_model=TrainingResponse)
async def train_creditcard_quantum_model(config: TrainingConfig):
    global creditcard_quantum_model, creditcard_scaler_quantum, creditcard_data

    # Load default dataset if none uploaded
    if creditcard_data is None:
        if os.path.exists(DEFAULT_CREDITCARD_CSV):
            creditcard_data = pd.read_csv(DEFAULT_CREDITCARD_CSV)
        else:
            raise HTTPException(status_code=400, detail="Credit card dataset not uploaded, and default CSV not found.")

    try:
        # Check data balance
        fraud_count = int(creditcard_data['Class'].sum())
        total_count = len(creditcard_data)
        fraud_ratio = fraud_count / total_count
        
        print(f"Dataset stats - Total: {total_count}, Fraud: {fraud_count}, Ratio: {fraud_ratio:.4f}")

        feature_cols = ['Time', 'Amount', 'V1', 'V2']
        X = creditcard_data[feature_cols].values
        y = creditcard_data['Class'].values

      
        creditcard_scaler_quantum = StandardScaler()
        X_scaled = creditcard_scaler_quantum.fit_transform(X)

       
        fraud_indices = np.where(y == 1)[0]
        normal_indices = np.where(y == 0)[0]
        
       
        n_fraud = len(fraud_indices)
        n_normal = min(len(normal_indices), n_fraud * 5) 
        
      
        selected_normal = np.random.choice(normal_indices, n_normal, replace=False)
        
        
        balanced_indices = np.concatenate([fraud_indices, selected_normal])
        np.random.shuffle(balanced_indices)
        
     
        X_balanced = X_scaled[balanced_indices]
        y_balanced = y[balanced_indices]
        
       
        max_samples = min(3000, len(X_balanced))
        if len(X_balanced) > max_samples:
            sample_indices = np.random.choice(len(X_balanced), max_samples, replace=False)
            X_final = X_balanced[sample_indices]
            y_final = y_balanced[sample_indices]
        else:
            X_final = X_balanced
            y_final = y_balanced

        print(f"Training quantum model on {len(X_final)} samples")
        print(f"Fraud ratio in training: {np.mean(y_final):.4f}")

        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X_final, y_final, test_size=0.2, random_state=config.seed, stratify=y_final
        )

        
        qnp.random.seed(config.seed)
        W = qnp.array(0.01 * qnp.random.randn(2*n_qubits), requires_grad=True)

      
        opt = qml.GradientDescentOptimizer(stepsize=config.stepsize)
        X_train_q = qnp.array(X_train, requires_grad=False)
        y_train_q = qnp.array(y_train, requires_grad=False)

        batch_size = min(config.batch_size, 32)  
        
        for epoch in range(config.epochs):
           
            idx = np.random.choice(len(X_train), min(batch_size, len(X_train)), replace=False)
            batchX = X_train_q[idx]
            batchY = y_train_q[idx]
            
            try:
                W = opt.step(lambda w: bce_loss(w, batchX, batchY), W)
            except Exception as e:
                print(f"Training step error at epoch {epoch}: {e}")
                continue

        try:
            probs = predict_batch(W, qnp.array(X_test))
            probs_np = np.asarray(probs)
            preds = (probs_np > 0.5).astype(int)
            
          
            if len(np.unique(y_test)) > 1: 
                auc = roc_auc_score(y_test, probs_np)
            else:
                auc = 0.5  
                
            f1 = f1_score(y_test, preds, zero_division=0)
            precision, recall, f1s, support = precision_recall_fscore_support(y_test, preds, zero_division=0)
            class_report = classification_report(y_test, preds, output_dict=True, zero_division=0)
            
            
            creditcard_quantum_model = W

            metrics = {
                "auc": float(auc),
                "f1": float(f1),
                "test_accuracy": float(np.mean(preds == y_test)),
                "precision": precision.tolist(),
                "recall": recall.tolist(),
                "f1_per_class": f1s.tolist(),
                "support": support.tolist(),
                "classification_report": class_report,
                "training_samples": len(X_final),
                "fraud_ratio": float(np.mean(y_final)),
                "test_fraud_predictions": int(np.sum(preds)),
                "test_fraud_actual": int(np.sum(y_test))
            }

            return TrainingResponse(
                success=True,
                message=f"Credit card quantum model trained successfully on {len(X_final)} balanced samples",
                metrics=metrics
            )
        except Exception as eval_error:
            return TrainingResponse(
                success=False,
                message=f"Training completed but evaluation failed: {str(eval_error)}",
                metrics={}
            )

    except Exception as e:
        return TrainingResponse(
            success=False,
            message=f"Training failed: {str(e)}",
            metrics={}
        )


@app.post("/train-creditcard-classical", response_model=TrainingResponse)
async def train_creditcard_classical_models():
    global creditcard_classical_models, creditcard_scaler_classical, creditcard_data

    if creditcard_data is None:
        if os.path.exists(DEFAULT_CREDITCARD_CSV):
            creditcard_data = pd.read_csv(DEFAULT_CREDITCARD_CSV)
        else:
            raise HTTPException(status_code=400, detail="Credit card dataset not uploaded and default CSV not found.")

    try:
        
        fraud_count = int(creditcard_data['Class'].sum())
        total_count = len(creditcard_data)
        fraud_ratio = fraud_count / total_count
        
        print(f"Dataset stats - Total: {total_count}, Fraud: {fraud_count}, Ratio: {fraud_ratio:.4f}")

       
        feature_cols = ['Time', 'Amount'] + [f'V{i}' for i in range(1, 29)]
        X = creditcard_data[feature_cols].values
        y = creditcard_data['Class'].values

      
        creditcard_scaler_classical = StandardScaler()
        X_scaled = creditcard_scaler_classical.fit_transform(X)

       
        fraud_indices = np.where(y == 1)[0]
        normal_indices = np.where(y == 0)[0]
        
       
        n_fraud = len(fraud_indices)
        n_normal = min(len(normal_indices), n_fraud * 10)  
        
        
        selected_normal = np.random.choice(normal_indices, n_normal, replace=False)
        
       
        fraud_oversample_factor = 3  
        fraud_oversampled = np.tile(fraud_indices, fraud_oversample_factor)
     
        combined_indices = np.concatenate([fraud_oversampled, selected_normal])
        np.random.shuffle(combined_indices)
        
       
        max_samples = min(80000, len(combined_indices))
        if len(combined_indices) > max_samples:
            sample_indices = np.random.choice(len(combined_indices), max_samples, replace=False)
            final_indices = combined_indices[sample_indices]
        else:
            final_indices = combined_indices
            
        X_final = X_scaled[final_indices]
        y_final = y[final_indices]

        print(f"Training classical models on {len(X_final)} samples")
        print(f"Fraud ratio in training: {np.mean(y_final):.4f}")

        
        X_train, X_test, y_train, y_test = train_test_split(
            X_final, y_final, test_size=0.2, random_state=42, stratify=y_final
        )

        rf_model = RandomForestClassifier(
            n_estimators=100, 
            random_state=42, 
            class_weight='balanced',  
            max_depth=10,
            min_samples_split=10,
            min_samples_leaf=5
        )
        
        lr_model = LogisticRegression(
            random_state=42, 
            class_weight='balanced',  
            max_iter=2000,
            solver='liblinear'
        )

        print("Training Random Forest...")
        rf_model.fit(X_train, y_train)
        print("Training Logistic Regression...")
        lr_model.fit(X_train, y_train)

        rf_probs = rf_model.predict_proba(X_test)[:, 1]
        lr_probs = lr_model.predict_proba(X_test)[:, 1]

        thresholds = [0.1, 0.2, 0.3, 0.4, 0.5]
        best_threshold = 0.5
        best_f1 = 0
        
        for threshold in thresholds:
            rf_preds_thresh = (rf_probs > threshold).astype(int)
            f1_thresh = f1_score(y_test, rf_preds_thresh, zero_division=0)
            if f1_thresh > best_f1:
                best_f1 = f1_thresh
                best_threshold = threshold

        print(f"Best threshold found: {best_threshold} with F1: {best_f1}")

      
        rf_preds = (rf_probs > best_threshold).astype(int)
        lr_preds = (lr_probs > best_threshold).astype(int)

        rf_auc = roc_auc_score(y_test, rf_probs)
        lr_auc = roc_auc_score(y_test, lr_probs)

        rf_f1 = f1_score(y_test, rf_preds, zero_division=0)
        lr_f1 = f1_score(y_test, lr_preds, zero_division=0)

        rf_accuracy = np.mean(rf_preds == y_test)
        lr_accuracy = np.mean(lr_preds == y_test)

        rf_report = classification_report(y_test, rf_preds, output_dict=True, zero_division=0)
        lr_report = classification_report(y_test, lr_preds, output_dict=True, zero_division=0)

        creditcard_classical_models = {
            "random_forest": rf_model,
            "logistic_regression": lr_model,
            "optimal_threshold": best_threshold
        }

        metrics = {
            "random_forest_auc": float(rf_auc),
            "logistic_regression_auc": float(lr_auc),
            "random_forest_f1": float(rf_f1),
            "logistic_regression_f1": float(lr_f1),
            "random_forest_accuracy": float(rf_accuracy),
            "logistic_regression_accuracy": float(lr_accuracy),
            "random_forest_report": rf_report,
            "logistic_regression_report": lr_report,
            "training_samples": len(X_final),
            "fraud_ratio": float(np.mean(y_final)),
            "optimal_threshold": float(best_threshold),
            "rf_fraud_predictions": int(np.sum(rf_preds)),
            "lr_fraud_predictions": int(np.sum(lr_preds)),
            "actual_fraud": int(np.sum(y_test)),
            "rf_fraud_detected": int(np.sum((rf_preds == 1) & (y_test == 1))),
            "lr_fraud_detected": int(np.sum((lr_preds == 1) & (y_test == 1)))
        }

        return TrainingResponse(
            success=True,
            message=f"Credit card classical models trained successfully on {len(X_final)} balanced samples",
            metrics=metrics
        )

    except Exception as e:
        return TrainingResponse(
            success=False,
            message=f"Training failed: {str(e)}",
            metrics={}
        )

@app.post("/predict-creditcard", response_model=CreditCardPredictionResponse)
async def predict_creditcard_transaction(transaction: CreditCardInput):
    global creditcard_quantum_model, creditcard_scaler_quantum
    global creditcard_classical_models, creditcard_scaler_classical

    if creditcard_quantum_model is None and not creditcard_classical_models:
        raise HTTPException(status_code=400, detail="No credit card models trained. Please train at least one model first.")

    try:
        results = {}
        predictions = []


        if creditcard_quantum_model is not None and creditcard_scaler_quantum is not None:
            try:
                x_quantum = np.array([
                    transaction.Time,
                    transaction.Amount,
                    transaction.V1,
                    transaction.V2
                ])
                x_quantum_scaled = creditcard_scaler_quantum.transform([x_quantum])
                quantum_prob = float(predict_batch(creditcard_quantum_model, qnp.array(x_quantum_scaled))[0])
                results["quantum_prediction"] = quantum_prob
                predictions.append(quantum_prob)
            except Exception as e:
                results["quantum_error"] = str(e)

        if creditcard_classical_models and creditcard_scaler_classical is not None:
            try:
                x_classical = np.array([
                    transaction.Time, transaction.Amount,
                    transaction.V1, transaction.V2, transaction.V3, transaction.V4, transaction.V5,
                    transaction.V6, transaction.V7, transaction.V8, transaction.V9, transaction.V10,
                    transaction.V11, transaction.V12, transaction.V13, transaction.V14, transaction.V15,
                    transaction.V16, transaction.V17, transaction.V18, transaction.V19, transaction.V20,
                    transaction.V21, transaction.V22, transaction.V23, transaction.V24, transaction.V25,
                    transaction.V26, transaction.V27, transaction.V28
                ])
                x_classical_scaled = creditcard_scaler_classical.transform([x_classical])

                if "random_forest" in creditcard_classical_models:
                    rf_prob = float(creditcard_classical_models["random_forest"].predict_proba(x_classical_scaled)[:, 1][0])
                    results["classical_rf_prediction"] = rf_prob
                    predictions.append(rf_prob)

                if "logistic_regression" in creditcard_classical_models:
                    lr_prob = float(creditcard_classical_models["logistic_regression"].predict_proba(x_classical_scaled)[:, 1][0])
                    results["classical_lr_prediction"] = lr_prob
                    predictions.append(lr_prob)
            except Exception as e:
                results["classical_error"] = str(e)

        if "quantum_prediction" in results and "classical_rf_prediction" in results and "classical_lr_prediction" in results:
            hybrid_prob = (
                results["quantum_prediction"] * 0.3 +
                results["classical_rf_prediction"] * 0.5 +
                results["classical_lr_prediction"] * 0.2
            )
            results["hybrid_prediction"] = hybrid_prob
        else:
            # fallback: hybrid = mean of available predictions
            if predictions:
                results["hybrid_prediction"] = float(np.mean(predictions))

        
        if len(predictions) > 1:
            results["confidence"] = float(1.0 - np.std(predictions))
        else:
            results["confidence"] = 1.0 

        results["is_fraud"] = results["hybrid_prediction"] > 0.5

        return CreditCardPredictionResponse(**results)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/save-prediction")
async def save_prediction(
    request: SavePredictionRequest,
    username: str = Depends(verify_token)
):
    try:
        print(f"DEBUG: save_prediction called for user: {username}")
        print(f"DEBUG: Request data: {request}")

        prediction_doc = {
            "user": username,
            "prediction_type": request.prediction_type,
            "input_data": request.input_data,
            "result": request.result,
            "timestamp": datetime.utcnow()
        }
        print(f"DEBUG: Saving document: {prediction_doc}")

        result_insert = await db.predictions.insert_one(prediction_doc)
        print(f"DEBUG: Insert result: {result_insert}")

        return {
            "success": True,
            "message": "Prediction saved successfully",
            "prediction_id": str(result_insert.inserted_id)
        }
    except HTTPException:
        print("DEBUG: HTTPException in save_prediction")
        raise
    except Exception as e:
        print(f"DEBUG: Exception in save_prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/saved-predictions")
async def get_saved_predictions(username: str = Depends(verify_token)):
    try:
        predictions = []
        async for prediction in db.predictions.find({"user": username}).sort("timestamp", -1):
            prediction["_id"] = str(prediction["_id"])
            predictions.append(prediction)

        return {
            "success": True,
            "predictions": predictions,
            "count": len(predictions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/saved-predictions/{prediction_id}")
async def delete_saved_prediction(prediction_id: str, username: str = Depends(verify_token)):
    try:
        result = await db.predictions.delete_one({
            "_id": ObjectId(prediction_id),
            "user": username
        })

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Prediction not found")

        return {
            "success": True,
            "message": "Prediction deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train-quantum", response_model=TrainingResponse)
async def train_quantum_model(config: TrainingConfig):
    global quantum_model, scaler_quantum

    try:
     
        X, y = make_toy_fraud(n=1400, seed=config.seed)

    
        scaler_quantum = StandardScaler()
        X_scaled = scaler_quantum.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=config.seed, stratify=y
        )

     
        qnp.random.seed(config.seed)
        W = qnp.array(0.01 * qnp.random.randn(2*n_qubits), requires_grad=True)

   
        opt = qml.GradientDescentOptimizer(stepsize=config.stepsize)
        X_train_q = qnp.array(X_train, requires_grad=False)
        y_train_q = qnp.array(y_train, requires_grad=False)

        for epoch in range(config.epochs):
            idx = np.random.choice(len(X_train), min(config.batch_size, len(X_train)), replace=False)
            batchX = X_train_q[idx]
            batchY = y_train_q[idx]
            W = opt.step(lambda w: bce_loss(w, batchX, batchY), W)

  
        probs = predict_batch(W, qnp.array(X_test))
        preds = (probs > 0.5).astype(int)
        auc = roc_auc_score(y_test, np.asarray(probs))
        f1 = f1_score(y_test, np.asarray(preds))
        precision, recall, f1s, support = precision_recall_fscore_support(y_test, preds, zero_division=0)
        class_report = classification_report(y_test, preds, output_dict=True)

      
        quantum_model = W

        metrics = {
            "auc": float(auc),
            "f1": float(f1),
            "test_accuracy": float(np.mean(preds == y_test)),
            "precision": precision.tolist(),
            "recall": recall.tolist(),
            "f1_per_class": f1s.tolist(),
            "support": support.tolist(),
            "classification_report": class_report
        }

        return TrainingResponse(
            success=True,
            message="Quantum model trained successfully",
            metrics=metrics
        )

    except Exception as e:
        return TrainingResponse(
            success=False,
            message=f"Training failed: {str(e)}",
            metrics={}
        )


@app.post("/train-classical", response_model=TrainingResponse)
async def train_classical_models():
    global classical_models, scaler_classical

    try:
        X, y = make_toy_fraud(n=1400, seed=42)
        X_extra = np.zeros((len(X), 3))  # Mock extra features
        X_all = np.hstack([X, X_extra])

     
        scaler_classical = StandardScaler()
        X_scaled = scaler_classical.fit_transform(X_all)

   
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )

  
        rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        lr_model = LogisticRegression(random_state=42)

        rf_model.fit(X_train, y_train)
        lr_model.fit(X_train, y_train)

      
        rf_preds = rf_model.predict(X_test)
        lr_preds = lr_model.predict(X_test)

        rf_probs = rf_model.predict_proba(X_test)[:, 1]
        lr_probs = lr_model.predict_proba(X_test)[:, 1]

        
        rf_auc = roc_auc_score(y_test, rf_probs)
        lr_auc = roc_auc_score(y_test, lr_probs)

        rf_f1 = f1_score(y_test, rf_preds, zero_division=0)
        lr_f1 = f1_score(y_test, lr_preds, zero_division=0)

        rf_accuracy = np.mean(rf_preds == y_test)
        lr_accuracy = np.mean(lr_preds == y_test)

        rf_report = classification_report(y_test, rf_preds, output_dict=True, zero_division=0)
        lr_report = classification_report(y_test, lr_preds, output_dict=True, zero_division=0)

        # Store
        classical_models = {
            "random_forest": rf_model,
            "logistic_regression": lr_model
        }

        metrics = {
            "random_forest_auc": float(rf_auc),
            "logistic_regression_auc": float(lr_auc),
            "random_forest_f1": float(rf_f1),
            "logistic_regression_f1": float(lr_f1),
            "random_forest_accuracy": float(rf_accuracy),
            "logistic_regression_accuracy": float(lr_accuracy),
            "random_forest_report": rf_report,
            "logistic_regression_report": lr_report
        }

        return TrainingResponse(
            success=True,
            message="Classical models trained successfully",
            metrics=metrics
        )

    except Exception as e:
        return TrainingResponse(
            success=False,
            message=f"Training failed: {str(e)}",
            metrics={}
        )


    except Exception as e:
        return TrainingResponse(
            success=False,
            message=f"Training failed: {str(e)}",
            metrics={}
        )

@app.post("/predict", response_model=PredictionResponse)
async def predict_transaction(transaction: TransactionInput):
    global quantum_model, scaler_quantum, classical_models, scaler_classical

    if quantum_model is None and not classical_models:
        raise HTTPException(status_code=400, detail="No models trained. Train at least one model first.")

    try:
      
        device_map = {"Mobile": 0.2, "Desktop": 0.5, "ATM": 0.8}
        cat_map = {"Electronics": 0.0, "Grocery": 0.5, "Entertainment": 1.0}
        type_map = {"Online": 0.2, "In-Person": 0.5, "ATM": 0.8}

        x_quantum = np.array([
            transaction.amount / 1000.0,
            transaction.hour / 24.0,
            device_map.get(transaction.device, 0.5),
            transaction.merchant_risk
        ])

   
        x_extra = np.array([
            cat_map.get(transaction.merchant_category, 0.5),
            type_map.get(transaction.transaction_type, 0.5),
            transaction.cardholder_age / 100.0
        ])
        x_classical = np.hstack([x_quantum, x_extra])

        results = {}
        predictions = []

        if quantum_model is not None and scaler_quantum is not None:
            try:
                x_quantum_scaled = scaler_quantum.transform([x_quantum])
                quantum_prob = float(predict_batch(quantum_model, qnp.array(x_quantum_scaled))[0])
                results["quantum_prediction"] = quantum_prob
                predictions.append(quantum_prob)
            except Exception as e:
                results["quantum_error"] = str(e)

        if classical_models and scaler_classical is not None:
            try:
                x_classical_scaled = scaler_classical.transform([x_classical])
                if "random_forest" in classical_models:
                    rf_prob = float(classical_models["random_forest"].predict_proba(x_classical_scaled)[:, 1][0])
                    results["classical_rf_prediction"] = rf_prob
                    predictions.append(rf_prob)

                if "logistic_regression" in classical_models:
                    lr_prob = float(classical_models["logistic_regression"].predict_proba(x_classical_scaled)[:, 1][0])
                    results["classical_lr_prediction"] = lr_prob
                    predictions.append(lr_prob)
            except Exception as e:
                results["classical_error"] = str(e)

        # --- Hybrid ---
        if predictions:
            results["hybrid_prediction"] = float(np.mean(predictions))
        else:
            results["hybrid_prediction"] = 0.0

        results["is_fraud"] = results["hybrid_prediction"] > 0.5

        return PredictionResponse(**results)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics():
    global quantum_model, classical_models, scaler_quantum, scaler_classical

    if quantum_model is None or not classical_models:
        raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")

    try:
 
        X, y = make_toy_fraud(n=500, seed=999)
        X_extra = np.zeros((len(X), 3))
        X_all = np.hstack([X, X_extra])

  
        X_quantum_scaled = scaler_quantum.transform(X)
        X_classical_scaled = scaler_classical.transform(X_all)

   
        quantum_probs = np.array([float(p) for p in predict_batch(quantum_model, qnp.array(X_quantum_scaled))])
        rf_probs = classical_models["random_forest"].predict_proba(X_classical_scaled)[:, 1]
        lr_probs = classical_models["logistic_regression"].predict_proba(X_classical_scaled)[:, 1]

     
        quantum_auc = roc_auc_score(y, quantum_probs)
        rf_auc = roc_auc_score(y, rf_probs)
        lr_auc = roc_auc_score(y, lr_probs)

       
        feature_names = ["Amount", "Time", "Device", "Merchant Risk"]
        rf_importance = classical_models["random_forest"].feature_importances_[:4]  # First 4 features

       
        quantum_preds = (quantum_probs > 0.5).astype(int)
        cm = confusion_matrix(y, quantum_preds).tolist()

        return AnalyticsResponse(
            model_performance={
                "quantum_auc": float(quantum_auc),
                "random_forest_auc": float(rf_auc),
                "logistic_regression_auc": float(lr_auc)
            },
            feature_importance={
                feature_names[i]: float(rf_importance[i]) for i in range(len(feature_names))
            },
            confusion_matrix=cm
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/creditcard-analytics", response_model=AnalyticsResponse)
async def get_creditcard_analytics(username: str = Depends(verify_token)):
    global creditcard_quantum_model, creditcard_classical_models, creditcard_scaler_quantum, creditcard_scaler_classical, creditcard_data

    if creditcard_quantum_model is None or not creditcard_classical_models or creditcard_data is None:
        raise HTTPException(status_code=400, detail="Credit card models not trained or data not loaded.")

    try:
       
        n_samples = min(1000, len(creditcard_data))
        sample_data = creditcard_data.sample(n=n_samples, random_state=42)

        
        feature_cols_quantum = ['Time', 'Amount', 'V1', 'V2']
        feature_cols_classical = ['Time', 'Amount'] + [f'V{i}' for i in range(1, 29)]

        X_quantum = sample_data[feature_cols_quantum].values
        X_classical = sample_data[feature_cols_classical].values
        y = sample_data['Class'].values

        X_quantum_scaled = creditcard_scaler_quantum.transform(X_quantum)
        X_classical_scaled = creditcard_scaler_classical.transform(X_classical)

        
        quantum_probs = np.array([float(p) for p in predict_batch(creditcard_quantum_model, qnp.array(X_quantum_scaled))])
        rf_probs = creditcard_classical_models["random_forest"].predict_proba(X_classical_scaled)[:, 1]
        lr_probs = creditcard_classical_models["logistic_regression"].predict_proba(X_classical_scaled)[:, 1]

     
        quantum_auc = roc_auc_score(y, quantum_probs)
        rf_auc = roc_auc_score(y, rf_probs)
        lr_auc = roc_auc_score(y, lr_probs)

      
        feature_names = ['Time', 'Amount'] + [f'V{i}' for i in range(1, 29)]
        rf_importance = creditcard_classical_models["random_forest"].feature_importances_

        
        top_indices = np.argsort(rf_importance)[-10:]
        top_features = {feature_names[i]: float(rf_importance[i]) for i in top_indices}

     
        quantum_preds = (quantum_probs > 0.5).astype(int)
        cm = confusion_matrix(y, quantum_preds).tolist()

        return AnalyticsResponse(
            model_performance={
                "quantum_auc": float(quantum_auc),
                "random_forest_auc": float(rf_auc),
                "logistic_regression_auc": float(lr_auc)
            },
            feature_importance=top_features,
            confusion_matrix=cm
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/simulate-transactions")
async def simulate_random_transactions(count: int = 10):
    global quantum_model, classical_models, scaler_quantum, scaler_classical

    if quantum_model is None or not classical_models:
        raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")

    try:
        results = []
        device_map = {"Mobile": 0.2, "Desktop": 0.5, "ATM": 0.8}
        cat_map = {"Electronics": 0.0, "Grocery": 0.5, "Entertainment": 1.0}
        type_map = {"Online": 0.2, "In-Person": 0.5, "ATM": 0.8}

        for i in range(count):
         
            amount = np.random.randint(10, 2000)
            hour = np.random.randint(0, 24)
            device = np.random.choice(["Mobile", "Desktop", "ATM"])
            merchant_risk = np.random.rand()
            category = np.random.choice(["Electronics", "Grocery", "Entertainment"])
            trans_type = np.random.choice(["Online", "In-Person", "ATM"])
            age = np.random.randint(18, 80)

            x_quantum = np.array([
                amount / 1000.0, hour / 24.0,
                device_map[device], merchant_risk
            ])
            x_extra = np.array([
                cat_map[category], type_map[trans_type], age / 100.0
            ])
            x_classical = np.hstack([x_quantum, x_extra])

            x_quantum_scaled = scaler_quantum.transform([x_quantum])
            x_classical_scaled = scaler_classical.transform([x_classical])

            quantum_prob = float(predict_batch(quantum_model, qnp.array(x_quantum_scaled))[0])
            rf_prob = float(classical_models["random_forest"].predict_proba(x_classical_scaled)[:, 1][0])
            hybrid_prob = (quantum_prob + rf_prob) / 2

            results.append({
                "id": i + 1,
                "amount": amount,
                "hour": hour,
                "device": device,
                "merchant_risk": round(merchant_risk, 3),
                "category": category,
                "transaction_type": trans_type,
                "age": age,
                "quantum_prediction": round(quantum_prob, 3),
                "rf_prediction": round(rf_prob, 3),
                "hybrid_prediction": round(hybrid_prob, 3),
                "is_fraud": hybrid_prob > 0.5
            })

            # Small delay for realistic simulation
            await asyncio.sleep(0.1)

        return {"transactions": results}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/model-status")
async def get_model_status():
    return {
        "quantum_model_trained": quantum_model is not None,
        "classical_models_trained": bool(classical_models),
        "creditcard_quantum_model_trained": creditcard_quantum_model is not None,
        "creditcard_classical_models_trained": bool(creditcard_classical_models),
        "creditcard_data_loaded": creditcard_data is not None,
        "available_models": list(classical_models.keys()) if classical_models else [],
        "available_creditcard_models": list(creditcard_classical_models.keys()) if creditcard_classical_models else []
    }

# User Statistics Route
@app.get("/user-stats")
async def get_user_stats(username: str = Depends(verify_token)):
    try:
        # Count predictions by type
        pipeline = [
            {"$match": {"user": username}},
            {"$group": {
                "_id": "$prediction_type",
                "count": {"$sum": 1}
            }}
        ]

        prediction_counts = {}
        async for result in db.predictions.aggregate(pipeline):
            prediction_counts[result["_id"]] = result["count"]

    
        recent_predictions = []
        async for prediction in db.predictions.find({"user": username}).sort("timestamp", -1).limit(5):
            prediction["_id"] = str(prediction["_id"])
            recent_predictions.append(prediction)


        total_predictions = await db.predictions.count_documents({"user": username})

        return {
            "username": username,
            "total_predictions": total_predictions,
            "prediction_counts": prediction_counts,
            "recent_predictions": recent_predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-creditcard-batch")
async def predict_creditcard_batch(
    transactions: List[CreditCardInput],
    username: str = Depends(verify_token)
):
    global creditcard_quantum_model, creditcard_scaler_quantum, creditcard_classical_models, creditcard_scaler_classical

    if creditcard_quantum_model is None or not creditcard_classical_models:
        raise HTTPException(status_code=400, detail="Credit card models not trained. Please train models first.")

    try:
        results = []

        for i, transaction in enumerate(transactions):
            # Prepare quantum features (4 features)
            x_quantum = np.array([
                transaction.Time,
                transaction.Amount,
                transaction.V1,
                transaction.V2
            ])

            # Prepare classical features (all 30 features)
            x_classical = np.array([
                transaction.Time, transaction.Amount,
                transaction.V1, transaction.V2, transaction.V3, transaction.V4, transaction.V5,
                transaction.V6, transaction.V7, transaction.V8, transaction.V9, transaction.V10,
                transaction.V11, transaction.V12, transaction.V13, transaction.V14, transaction.V15,
                transaction.V16, transaction.V17, transaction.V18, transaction.V19, transaction.V20,
                transaction.V21, transaction.V22, transaction.V23, transaction.V24, transaction.V25,
                transaction.V26, transaction.V27, transaction.V28
            ])

            # Scale features
            x_quantum_scaled = creditcard_scaler_quantum.transform([x_quantum])
            x_classical_scaled = creditcard_scaler_classical.transform([x_classical])

            # Predictions
            quantum_prob = float(predict_batch(creditcard_quantum_model, qnp.array(x_quantum_scaled))[0])
            rf_prob = float(creditcard_classical_models["random_forest"].predict_proba(x_classical_scaled)[:, 1][0])
            lr_prob = float(creditcard_classical_models["logistic_regression"].predict_proba(x_classical_scaled)[:, 1][0])

            # Hybrid prediction
            hybrid_prob = (quantum_prob * 0.3 + rf_prob * 0.5 + lr_prob * 0.2)

            # Confidence score
            predictions = [quantum_prob, rf_prob, lr_prob]
            confidence = 1.0 - np.std(predictions)

            results.append({
                "transaction_id": i + 1,
                "quantum_prediction": round(quantum_prob, 4),
                "rf_prediction": round(rf_prob, 4),
                "lr_prediction": round(lr_prob, 4),
                "hybrid_prediction": round(hybrid_prob, 4),
                "is_fraud": hybrid_prob > 0.5,
                "confidence": round(float(confidence), 4),
                "amount": transaction.Amount
            })

        # Summary statistics
        fraud_count = sum(1 for r in results if r["is_fraud"])
        avg_confidence = np.mean([r["confidence"] for r in results])
        total_amount = sum(r["amount"] for r in results)
        fraud_amount = sum(r["amount"] for r in results if r["is_fraud"])

        return {
            "results": results,
            "summary": {
                "total_transactions": len(transactions),
                "fraud_detected": fraud_count,
                "fraud_percentage": round((fraud_count / len(transactions)) * 100, 2),
                "average_confidence": round(avg_confidence, 4),
                "total_amount": round(total_amount, 2),
                "potential_fraud_amount": round(fraud_amount, 2)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Export Predictions Route
@app.get("/export-predictions")
async def export_predictions(username: str = Depends(verify_token)):
    try:
        predictions = []
        async for prediction in db.predictions.find({"user": username}).sort("timestamp", -1):
            prediction["_id"] = str(prediction["_id"])
            predictions.append(prediction)

        # Convert to CSV format
        if predictions:
            df = pd.DataFrame(predictions)
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_content = csv_buffer.getvalue()

            return {
                "success": True,
                "csv_data": csv_content,
                "count": len(predictions)
            }
        else:
            return {
                "success": True,
                "csv_data": "",
                "count": 0,
                "message": "No predictions found"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    nest_asyncio.apply()


    public_url = ngrok.connect(8000)
    print("🚀 FastAPI is live at:", public_url)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(public_url), "http://localhost:3000", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    uvicorn.run(app, host="0.0.0.0", port=8000)