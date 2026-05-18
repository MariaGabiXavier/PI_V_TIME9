from flask import Flask, request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    df = pd.DataFrame(data)

    # valida quantidade mínima
    if len(df) < 5:
        return jsonify({
            "status": "INSUFFICIENT_DATA",
            "message": "Poucos dados para previsão"
        }), 400

    # features
    X = df[["month", "price", "stockQuantity"]]

    # target
    y = df["totalSold"]

    # modelo
    model = RandomForestRegressor(
        n_estimators=50,
        random_state=42
    )

    # treino
    model.fit(X, y)

    alerts = []

    # previsão produto por produto
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

        recommended_restock = max(
            prediction30 - stock,
            0
        )

        alert = "OK"

        if stock < prediction7:
            alert = "URGENTE"

        elif stock < prediction15:
            alert = "ATENCAO"

        alerts.append({
            "productName": row["productName"],
            "stockQuantity": int(stock),
            "prediction7Days": int(prediction7),
            "prediction15Days": int(prediction15),
            "prediction30Days": int(prediction30),
            "recommendedRestock": int(recommended_restock),
            "alert": alert
        })

    return jsonify(alerts)

if __name__ == "__main__":
    app.run(port=5000)