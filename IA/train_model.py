import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

# DADOS DE TREINAMENTO (FICTÍCIOS)
data = {
    "month": [1,2,3,4,5,6,7,8,9,10,11,12],
    "price": [10,12,9,15,20,25,30,18,16,14,13,11],
    "currentStock": [100,90,80,70,60,50,40,30,20,15,10,5],
    "sales": [20,25,30,35,40,50,60,55,45,35,30,25]
}

df = pd.DataFrame(data)

# FEATURES
X = df[["month", "price", "currentStock"]]

# TARGET
y = df["sales"]

# MODELO
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

# TREINAMENTO
model.fit(X, y)

# SALVAR MODELO
joblib.dump(model, "modelo_demanda.pkl")

print("Modelo treinado e salvo com sucesso!")