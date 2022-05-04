const Jogo = require('./Jogo')

test('posicao no tabuleiro OK', () => {
    expect(Jogo.posDentroDoTabuleiro(-1, 0)).toBe(false)
    expect(Jogo.posDentroDoTabuleiro(1, 0)).toBe(true)
})

test('validar movimento cachorro sem movimento OK', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    expect(Jogo.getPossiveisMovimentos(0, 0, true, tabuleiro))
        .toEqual([])
})
test('cachorro com 1 movimento', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    expect(Jogo.getPossiveisMovimentos(1, 2, true, tabuleiro))
        .toEqual([[1, 3]])

})
test('cachorro com 2 movimentos', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    expect(Jogo.getPossiveisMovimentos(0, 2, true, tabuleiro))
        .toEqual([[0, 3], [1, 3]])
})

test('cachorro movimento no triangulo', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[5][1] = 'C'
    const result = Jogo.getPossiveisMovimentos(1, 5, true, tabuleiro)
    expect(result.sort())
        .toEqual([
            [1, 6], [2, 5], [2, 4]
        ].sort())

})
test('onca captura cachorro linha reta', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[0][2] = '.'
    const result = Jogo.getPossiveisMovimentos(2, 2, false, tabuleiro)
    console.log('Movimentos da onça: ', result)
    expect(result.some(item => item[0] == 2 && item[1] == 0)).toBe(true)
})

test('onca pode captura cachorro na diagonal', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[0][0] = '.'
    const result = Jogo.getPossiveisMovimentos(2, 2, false, tabuleiro)
    console.log('Movimentos da onça: ', result)
    expect(result.some(item => item[0] == 0 && item[1] == 0)).toBe(true)
})
test('onca pode capturar cachorro no triangulo linha reta', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[2][2] = '.'
    tabuleiro[6][2] = 'O'
    tabuleiro[5][2] = 'C'
    const result = Jogo.getPossiveisMovimentos(2, 6, false, tabuleiro)
    expect(result.some(item => item[0] == 2 && item[1] == 4)).toBe(true)


})
test('tabuleiro após captura', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[0][2] = '.'
    novoTabuleiro = Jogo.getNovoTabuleiro(tabuleiro, 2, 0, 2, 2, false)
    tabuleiro[0][2] = 'C'
    tabuleiro[1][2] = '.'
    tabuleiro[2][2] = '.'
    if (!novoTabuleiro) {
        expect(false).toBe(true)
    }
    novoTabuleiro.every((linhaVetor, linha) => {
        return linhaVetor.every((item, coluna) => {
            return item === tabuleiro[linha][coluna]
        })
    })
})
test('cachorro não pode mover onça', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    expect(Jogo.ehMovimentoValido(2, 3, 2, 2, tabuleiro, true)).toBe(false)
})

test('deve ser true', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    expect(Jogo.ehMovimentoValido(2, 3, 2, 2, tabuleiro, false)).toBe(true)
    expect(Jogo.ehMovimentoValido(4, 3, 4, 2, tabuleiro, false)).toBe(true)

})

// TODO:
// test('onca captura cachorro no triangulo diagonal', () => { })
// testar captura mais de 1 cachorro na mesma jogada



