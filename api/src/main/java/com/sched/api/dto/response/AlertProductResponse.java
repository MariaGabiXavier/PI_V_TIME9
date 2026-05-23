package com.sched.api.dto.response;

public record AlertProductResponse(
        Long id,
        String nome,
        String imagem,
        Integer quantidade,
        Integer estoqueRecomendado,
        String validade,
        Integer quantidadeLote,
        String status,
        String descricao
) {
}
