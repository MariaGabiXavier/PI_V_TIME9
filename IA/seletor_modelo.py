import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

def build_models_and_select(df):

    if len(df) > 100:
        df = df.sample(100, random_state=42)

    X = df[["month", "price", "stockQuantity"]]
    y = df["totalSold"]

    # Padronização dos dados
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    rf_mae = mean_absolute_error(y_test, rf.predict(X_test))

    
    k = max(1, min(3, len(X_train) - 1))
    knn = KNeighborsRegressor(n_neighbors=k, weights="distance")
    knn.fit(X_train, y_train)
    knn_mae = mean_absolute_error(y_test, knn.predict(X_test))


    svm = SVR(kernel="rbf", C=10, epsilon=0.1, gamma="scale")
    svm.fit(X_train, y_train)
    svm_mae = mean_absolute_error(y_test, svm.predict(X_test))

    print(f"[Seleção] RandomForest MAE={rf_mae:.2f} | KNN MAE={knn_mae:.2f} | SVM MAE={svm_mae:.2f}")

    melhor_mae = min(rf_mae, knn_mae, svm_mae)

    if melhor_mae == rf_mae:
        print("[Seleção] Vencedor: RandomForest")
        return rf, scaler, "RandomForest", rf_mae
    elif melhor_mae == knn_mae:
        print("[Seleção] Vencedor: KNN")
        return knn, scaler, "KNN", knn_mae
    else:
        print("[Seleção] Vencedor: SVM")
        return svm, scaler, "SVM", svm_mae