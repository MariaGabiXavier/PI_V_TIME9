import pandas as pd
import requests
from sklearn.ensemble import RandomForestRegressor

response = requests.get("http://localhost:8080/api/ai/demand-data")

print(response.status_code)
print(response.text)

data = response.json()

df = pd.DataFrame(data)

# Features
X = df[["month", "price", "stockQuantity"]]

# Target
y = df["totalSold"]

# Treinamento IA
model = RandomForestRegressor(
    n_estimators=50,
    random_state=42
)

model.fit(X, y)

alerts = []

# previsão por produto
# previsão por produto
for _, row in df.iterrows():

    features = pd.DataFrame([{
        "month": row["month"],
        "price": row["price"],
        "stockQuantity": row["stockQuantity"]
    }])

    predicted_sales = model.predict(features)[0]

    prediction7 = round(predicted_sales * 0.25)
    prediction15 = round(predicted_sales * 0.50)
    prediction30 = round(predicted_sales)

    stock = row["stockQuantity"]

    recommended_restock = max(0, prediction30 - stock)

    alert = "OK"

    if stock < prediction7:
        alert = "URGENTE"

    elif stock < prediction15:
        alert = "ATENCAO"

    alerts.append({
        "productName": row["productName"],
        "stockQuantity": stock,
        "prediction7Days": prediction7,
        "prediction15Days": prediction15,
        "prediction30Days": prediction30,
        "recommendedRestock": recommended_restock,
        "alert": alert
    })

alerts_df = pd.DataFrame(alerts)

import json

print(json.dumps(alerts))