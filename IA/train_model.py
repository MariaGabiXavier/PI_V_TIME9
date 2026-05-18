'''esse codigo serve apenas para testes, ele n faz parte DA IA REAL'''
import pandas as pd
import requests
from sklearn.ensemble import RandomForestRegressor

response = requests.get(
    "http://localhost:8080/ai/demand-data"
)

data = response.json()

df = pd.DataFrame(data)

if len(df) < 5:
    print("Dados insuficientes")
    exit()

X = df[["month", "price", "stockQuantity"]]
y = df["totalSold"]

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)

results = []

for _, row in df.iterrows():

    predict_data = pd.DataFrame([{
        "month": row["month"],
        "price": row["price"],
        "stockQuantity": row["stockQuantity"]
    }])

    prediction = int(
        model.predict(predict_data)[0]
    )

    results.append({
        "productName": row["productName"],
        "prediction30Days": prediction
    })

print(results)