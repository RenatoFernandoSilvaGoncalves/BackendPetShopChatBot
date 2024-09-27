import Pedido from "../Models/Pedido.js";
import conectar from "./conexao.js";

export default class PedidoDAO{

    constructor(){
        this.init();
    }
    async init(){
        try {
            const sql = `CREATE TABLE IF NOT EXISTS pedido(
                codigo int not null primary key auto_increment,
                nome varchar(100) not null,
                telefone varchar(50) not null,
                endereco varchar(250) not null,
                valorTotal decimal(10,2) not null
            )`;
            const conexao = await conectar();
            await conexao.execute(sql);
            const sql2 = `CREATE TABLE IF NOT EXISTS pedido_servico(
                pedido_codigo int not null,
                servico_codigo int not null,
                constraint fk_pedido foreign key (pedido_codigo) references pedido(codigo),
                constraint fk_servico foreign key (servico_codigo) references servico(codigo),
                quantidade int not null,
                valorUnitario decimal(10,2) not null
                
            );`;
            await conexao.execute(sql2);
            global.poolConexoes.releaseConnection(conexao);
            console.log("Banco de dados iniciado com sucesso!");

        } catch(erro) {
            console.log("Erro ao iniciar o banco de dados: " + erro.message);
        }
    }
    async gravar(pedido){
        if (pedido instanceof Pedido){
            const sql = `INSERT INTO pedido (nome, telefone, endereco, valorTotal) VALUES (?, ?, ?, ?)`;
            const parametros = [
                pedido.nome,
                pedido.telefone,
                pedido.endereco,
                pedido.valorTotal
            ]
            const conexao = await conectar();
            const resultado = await conexao.execute(sql, parametros);
            pedido.codigo = resultado[0].insertId;

            for (const item of pedido.itensPedido){
                const sql2 = `INSERT INTO pedido_servico(pedido_codigo, servico_codigo, quantidade, valorUnitario) VALUES(?, ?, ?, ?)`;
                const parametros = [
                    pedido.codigo,
                    item.servico.codigo,
                    item.quantidade,
                    item.servico.valorServico
                ]
                await conexao.execute(sql2, parametros);
            }
            global.poolConexoes.releaseConnection(conexao);
        }
    }
}