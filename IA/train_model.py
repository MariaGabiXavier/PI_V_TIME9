import pandas as pd
import requests
import joblib
from sklearn.ensemble import RandomForestRegressor

response = requests.get("http://localhost:8080/api/ai/demand-data")
data = response.json()

df = pd.DataFrame(data)

# valida se existe histórico mínimo
if len(df) < 10:
    print("Dados insuficientes para previsão.")
    exit()

# separa por produto
results = []

for product_id in df["productId"].unique():

    product_df = df[df["productId"] == product_id].copy()

    # mínimo de histórico por produto
    if len(product_df) < 5:
        results.append({
            "productId": product_id,
            "status": "INSUFFICIENT_DATA"
        })
        continue

    X = product_df[["month", "price", "stockQuantity"]]
    y = product_df["totalSold"]

    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    last = product_df.iloc[-1]

    predict_data = pd.DataFrame([{
        "month": last["month"],
        "price": last["price"],
        "stockQuantity": last["stockQuantity"]
    }])

    prediction = int(model.predict(predict_data)[0])

    results.append({
        "productId": product_id,
        "productName": last["productName"],
        "prediction7Days": int(prediction * 0.25),
        "prediction15Days": int(prediction * 0.50),
        "prediction30Days": prediction,
        "currentStock": int(last["stockQuantity"]),
        "recommendedRestock": max(
            prediction - int(last["stockQuantity"]), 0
        ),
        "status": "OK"
    })

joblib.dump(model, "modelo_demanda.pkl")

print(results)