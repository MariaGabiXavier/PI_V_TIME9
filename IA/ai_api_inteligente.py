from flask import Flask, request, jsonify
import pandas as pd
from seletor_modelo import build_models_and_select

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    df = pd.DataFrame(data)

    alerts = []

    # Com dados suficientes, usa os modelos de IA
    if len(df) >= 2:
        model, scaler, model_name, mae = build_models_and_select(df)

        for _, row in df.iterrows():
            features = pd.DataFrame([{
                "month": row["month"],
                "price": row["price"],
                "stockQuantity": row["stockQuantity"]
            }])

            if scaler is not None:
                features = scaler.transform(features)

            predicted_sales = model.predict(features)[0]

            alert, entry = gerar_alerta(row, predicted_sales, model_name, round(mae, 2))
            alerts.append(entry)

    # Com poucos dados, usa totalSold diretamente como previsão
    else:
        for _, row in df.iterrows():
            predicted_sales = row["totalSold"]
            alert, entry = gerar_alerta(row, predicted_sales, "Direto", 0.0)
            alerts.append(entry)

    return jsonify(alerts)


def gerar_alerta(row, predicted_sales, model_name, mae):
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

    entry = {
        "productName":        row["productName"],
        "stockQuantity":      int(stock),
        "prediction7Days":    int(prediction7),
        "prediction15Days":   int(prediction15),
        "prediction30Days":   int(prediction30),
        "recommendedRestock": int(recommended_restock),
        "alert":              alert,
        "modelUsed":          model_name,
        "modelMAE":           mae
    }

    return alert, entry


if __name__ == "__main__":
    app.run(port=5000)