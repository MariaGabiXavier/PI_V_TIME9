from flask import Flask, request, jsonify
import pandas as pd
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler

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

    # SVM também é muito sensível à escala — normalização obrigatória
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # SVR com kernel RBF (Radial Basis Function):
    #   - kernel="rbf": captura relações não-lineares entre features e target
    #   - C=100: penalização alta por erros — mais ajustado aos dados de treino
    #   - epsilon=0.1: margem de tolerância ao redor da curva de regressão
    #   - gamma="scale": ajusta o gamma automaticamente em função do nº de features
    model = SVR(
        kernel="rbf",
        C=100,
        epsilon=0.1,
        gamma="scale"
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

        # garante que a predição não seja negativa (SVR pode extrapolar)
        predicted_sales = max(predicted_sales, 0)

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
    # roda na porta 5002 para não conflitar com RF (5000) e KNN (5001)
    app.run(port=5002)
