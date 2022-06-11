const Jogo = require('./Jogo')
const { describe } = require('./models/User')

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
    expect(result.some(item => item[0] == 2 && item[1] == 0)).toBe(true)
})

test('onca pode captura cachorro na diagonal', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[0][0] = '.'
    const result = Jogo.getPossiveisMovimentos(2, 2, false, tabuleiro)
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

describe('possiveis movimentos na captura diagonal do triangulo', () => {
    let tabuleiro
    beforeEach(() => {
        tabuleiro = Jogo.getTabuleiroInicial()
        tabuleiro[2][2] = '.'
    })

    test('teste onca (3,6) cachorro (3,5)', () => {
        tabuleiro[6][3] = 'O'
        tabuleiro[5][3] = 'C'
        let result = Jogo.getPossiveisMovimentos(3, 6, false, tabuleiro)
        expect(result.sort()).toEqual([
            [2, 4], [2, 6]
        ].sort())
    })

    test('teste onca (1,6) cachorro (1,5)', () => {
        tabuleiro[6][1] = 'O'
        tabuleiro[5][1] = 'C'
        result = Jogo.getPossiveisMovimentos(1, 6, false, tabuleiro)
        expect(result.sort()).toEqual([
            [2, 4], [2, 6]
        ].sort())
    })

    test('teste onca (2,4) cachorro (2,5) e (1,5)', () => {
        tabuleiro[4][2] = 'O'
        tabuleiro[5][1] = 'C'
        tabuleiro[5][3] = 'C'
        result = Jogo.getPossiveisMovimentos(2, 4, false, tabuleiro)
        console.log(result)
        expect(result.sort()).toEqual([
            [1, 6], [1, 4], [1, 3], [2, 3], [2, 5], [3, 4], [3, 3], [3, 6]
        ].sort())
    })
})

test('captura invalida na diagonal do triangulo', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[2][2] = '.'
    tabuleiro[6][1] = 'O'
    tabuleiro[5][1] = 'C'
    const result = Jogo.getPossiveisMovimentos(2, 4, false, tabuleiro)
    expect(result.some(item => item[0] == 1 && item[1] == 4)).toBe(false)
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[2][2] = '.'
    tabuleiro[6][1] = 'O'
    tabuleiro[5][1] = 'C'
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
describe('tabuleiro após captura na diagonal do triangulo', () => {
    let tabuleiro
    beforeEach(() => {
        tabuleiro = Jogo.getTabuleiroInicial()
        tabuleiro[2][2] = '.'
    })

    test('captura (2,4) -> (1,6)', () => {
        tabuleiro[1][5] = 'C'
        novoTabuleiro = Jogo.getNovoTabuleiro(tabuleiro, 2, 4, 1, 6, false)
        expect(novoTabuleiro[5][1]).toEqual('.')
        expect(novoTabuleiro[6][1]).toEqual('O')
    })

    test('captura (2,4) -> (3,6)', () => {
        tabuleiro[1][5] = 'C'
        novoTabuleiro = Jogo.getNovoTabuleiro(tabuleiro, 2, 4, 3, 6, false)
        expect(novoTabuleiro[5][3]).toEqual('.')
        expect(novoTabuleiro[6][3]).toEqual('O')
    })
})

test('cachorro não pode mover onça', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    expect(Jogo.ehMovimentoValido(2, 3, 2, 2, tabuleiro, true)).toBe(false)
})

test('movimento da onça após captura', () => {
    tabuleiro = Jogo.getTabuleiroInicial()
    tabuleiro[0][2] = '.'
    movimentos = Jogo.getPossiveisMovimentos(2, 2, false, tabuleiro, true)
    expect(movimentos.every(item => item[0] == 2 && item[1] == 0)).toBe(true)
})



