from flask import Flask, request, jsonify
import pandas as pd
import joblib

app = Flask(__name__)

model = joblib.load("modelo_demanda.pkl")

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    # valida histórico
    if data.get("historyCount", 0) < 5:
        return jsonify({
            "status": "INSUFFICIENT_DATA",
            "message": "Sem dados suficientes para previsão"
        })

    df = pd.DataFrame([{
        "month": data["month"],
        "price": data["price"],
        "stockQuantity": data["stockQuantity"]
    }])

    prediction = int(model.predict(df)[0])

    response = {
        "status": "OK",
        "prediction7Days": int(prediction * 0.25),
        "prediction15Days": int(prediction * 0.50),
        "prediction30Days": prediction,
        "currentStock": data["stockQuantity"],
        "recommendedRestock": max(
            prediction - data["stockQuantity"], 0
        ),
        "alert": (
            "LOW_STOCK"
            if data["stockQuantity"] < prediction
            else "OK"
        )
    }

    return jsonify(response)

if __name__ == "__main__":
    app.run(port=5000)