import conectar from "./conexao.js";
import Servico from "../Models/Servico.js";
export default class ServicoDAO{

    constructor(){
        this.init();
    }
    async init(){
        try {
            const sql = `CREATE TABLE IF NOT EXISTS servico(
                codigo int not null primary key auto_increment,
                titulo varchar(100) not null,
                descricao varchar(200) not null,
                valorServico decimal(10,2) not null,
                urlImagem varchar(200)
            )`;
            const conexao = await conectar();
            await conexao.execute(sql);
            global.poolConexoes.releaseConnection(conexao);
            console.log("Banco de dados iniciado com sucesso!");

        } catch(erro) {
            console.log("Erro ao iniciar o banco de dados: " + erro.message);
        }
    }
    async gravar(servico){
        if (servico instanceof Servico){
            const sql = `INSERT INTO servico (titulo,descricao, valorServico, urlImagem) VALUES (?, ?, ?, ?)`;
            const parametros = [
                servico.titulo,
                servico.descricao,
                servico.valorServico,
                servico.urlImagem
            ]
            const conexao = await conectar();
            const resultado = await conexao.execute(sql, parametros);
            servico.codigo = resultado[0].insertId;
            global.poolConexoes.releaseConnection(conexao);
        }
    }

    async alterar(servico){ 
        if (servico instanceof Servico){
            const sql = `UPDATE servico SET titulo = ?, descricao = ?, valorServico = ?, urlImagem = ? WHERE codigo = ?`;
            const parametros = [
                servico.titulo,
                servico.descricao,
                servico.valorServico,
                servico.urlImagem,
                servico.codigo
            ]
            const conexao = await conectar();
            await conexao.execute(sql, parametros);
            global.poolConexoes.releaseConnection(conexao);
        }
    }

    async excluir(servico){
        if (servico instanceof Servico){
            const sql = `DELETE FROM servico WHERE codigo = ?`;
            const campos = [
                servico.codigo
            ]
            const conexao = await conectar();
            await conexao.execute(sql, campos);
            global.poolConexoes.releaseConnection(conexao);
        }
    }

    async consultar(){
        const sql = `SELECT * FROM servico`;
        const conexao = await conectar();
        const [registros, campos] = await conexao.execute(sql);
        global.poolConexoes.releaseConnection(conexao);
        const listaServicos = [];
        for(const registro of registros){
            const servico = new Servico(
                registro['codigo'],
                registro['titulo'],
                registro['descricao'],
                registro['valorServico'],
                registro['urlImagem']
            );
            listaServicos.push(servico);
        }
        return listaServicos;
    }

    async consultarTitulo(titulo){
        const sql = `SELECT * FROM servico WHERE titulo LIKE '%${titulo}%'`;
        const conexao = await conectar();
        const [registros, campos] = await conexao.execute(sql);
        global.poolConexoes.releaseConnection(conexao);
        const listaServicos = [];
        for(const registro of registros){
            const servico = new Servico(
                registro['codigo'],
                registro['titulo'],
                registro['descricao'],
                registro['valorServico'],
                registro['urlImagem']
            );
            listaServicos.push(servico);
        }
        return listaServicos;
    }
}