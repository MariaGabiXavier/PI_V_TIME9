package com.sched.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.InputStreamReader;

@RestController
@RequiredArgsConstructor
public class AiPredictionController {

    @GetMapping("/api/ai/predictions")
    public String getPredictions() {

        try {

            ProcessBuilder processBuilder = new ProcessBuilder(
                    "/Users/mariagabi/PI_V_TIME9/.venv/bin/python",
                    "/Users/mariagabi/PI_V_TIME9/IA/predict.py"
            );

            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            BufferedReader reader =
                    new BufferedReader(
                            new InputStreamReader(process.getInputStream())
                    );

            StringBuilder output = new StringBuilder();

            String line;

            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            process.waitFor();

            return output.toString();

        } catch (Exception e) {
            return """
                {
                    "error": "Erro ao executar IA",
                    "message": "%s"
                }
                """.formatted(e.getMessage());
        }
    }
}