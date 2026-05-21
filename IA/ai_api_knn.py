from flask import Flask, request, jsonify
import pandas as pd
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    df = pd.DataFrame(data)

    # valida quantidade mínima
    # KNN precisa de pelo menos k+1 amostras (k=3 aqui)
    if len(df) < 3:
        return jsonify({
            "status": "INSUFFICIENT_DATA",
            "message": "Poucos dados para previsão"
        }), 400

    # features
    X = df[["month", "price", "stockQuantity"]]

    # target
    y = df["totalSold"]

    # KNN é sensível à escala — normalização obrigatória
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # n_neighbors = 3 é um bom ponto de partida para datasets pequenos
    # weights="distance": vizinhos mais próximos têm mais peso na predição
    k = min(3, len(df) - 1)  # garante que k < n_samples
    model = KNeighborsRegressor(
        n_neighbors=k,
        weights="distance",
        metric="euclidean"
    )

    # treino
    model.fit(X_scaled, y)

    alerts = []

    # previsão produto por produto
    for _, row in df.iterrows():

        features = pd.DataFrame([{
            "month": row["month"],
            "price": row["price"],
            "stockQuantity": row["stockQuantity"]
        }])

        # escala o mesmo ponto com o scaler já ajustado no treino
        features_scaled = scaler.transform(features)

        predicted_sales = model.predict(features_scaled)[0]

        prediction7  = round(predicted_sales * 0.25)
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
            "productName":        row["productName"],
            "stockQuantity":      int(stock),
            "prediction7Days":    int(prediction7),
            "prediction15Days":   int(prediction15),
            "prediction30Days":   int(prediction30),
            "recommendedRestock": int(recommended_restock),
            "alert":              alert
        })

    return jsonify(alerts)


if __name__ == "__main__":
    # roda na porta 5001 para não conflitar com o Random Forest (5000)
    app.run(port=5001)
