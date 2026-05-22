from flask import Flask, request, jsonify
import pandas as pd
from seletor_modelo import build_models_and_select

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    df = pd.DataFrame(data)

    if len(df) < 6:  # mínimo para ter treino e teste
        return jsonify({
            "status": "INSUFFICIENT_DATA",
            "message": "Poucos dados para avaliação dos modelos"
        }), 400

    # Seleciona automaticamente o melhor modelo
    model, scaler, model_name, mae = build_models_and_select(df)

    X_full = df[["month", "price", "stockQuantity"]]

    alerts = []
    for _, row in df.iterrows():
        features = pd.DataFrame([{
            "month": row["month"],
            "price": row["price"],
            "stockQuantity": row["stockQuantity"]
        }])

        # KNN precisa do scaler, RF não
        if scaler is not None:
            features = scaler.transform(features)

        predicted_sales = model.predict(features)[0]

        prediction7  = round(predicted_sales * 0.25)
        prediction15 = round(predicted_sales * 0.50)
        prediction30 = round(predicted_sales)
        stock = row["stockQuantity"]
        recommended_restock = max(prediction30 - stock, 0)

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
            "alert":              alert,
            "modelUsed":          model_name,   # bônus: informa qual foi escolhida
            "modelMAE":           round(mae, 2)
        })

    return jsonify(alerts)

if __name__ == "__main__":
    app.run(port=5000)