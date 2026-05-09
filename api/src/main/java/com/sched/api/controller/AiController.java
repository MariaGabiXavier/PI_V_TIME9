package com.sched.api.controller;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.sched.api.domain.User;
import com.sched.api.dto.response.AiPredictionResponse;
import com.sched.api.service.AiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/predict")
    public List<AiPredictionResponse> predict(
            @AuthenticationPrincipal User user
    ) {
        return aiService.getPredictions(user);
    }

    @GetMapping("/predictions")
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