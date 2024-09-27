import { obterCardsServicos } from "../funcoesDFLOW/funcoes.js";
import Pedido from "../Models/Pedido.js";
import ItemPedido from "../Models/itemPedido.js";
import Servico from "../Models/Servico.js";
export default class DialogFlowCtrl{

    async processarIntencoes(requisicao,resposta){
        if (requisicao.method=='POST'){
            const dados = requisicao.body;
            const nomeIntencao = dados.queryResult.intent.displayName;
            //se a inteção for de boas vindas, nós vamos apresentar
            //o menu de serviços disponíveis enviando cards de serviços
            const origem = dados?.originalDetectIntentRequest?.source;
            if (nomeIntencao == "Default Welcome Intent"){
                
                if (origem){  //requisição está vindo do ambiente padrão
                    obterCardsServicos("custom").then((cards)=>{
                        let respostaDF = {
                            "fulfillmentMessages": []
                        }
                        respostaDF.fulfillmentMessages.push({
                            "text": {
                                "text": [
                                    "Bem vindo ao Petshop X! \n",
                                    "Esses são os nossos servicos: \n"
                                ]
                            }
                        });
                        respostaDF.fulfillmentMessages.push(...cards);
                        respostaDF.fulfillmentMessages.push({
                            "text": {
                                "text": [
                                    "Qual serviço você deseja?"
                                ]
                            }
                        })
                        resposta.status(200).json(respostaDF);
                    }).catch((erro)=>{
                        let respostaDF = {
                            "fulfillmentMessages": []
                        }
                        respostaDF.fulfillmentMessages.push({
                            "text": {
                                "text": [
                                    "Bem vindo ao Petshop X! \n",
                                    "Não foi possível recuperar a lista de serviços. \n",
                                    "O sistema está com problemas. \n",
                                ]
                            }
                        });
                        resposta.status(200).json(respostaDF);
                    });

                }
                else{ //requisição está vindo do messenger
                    obterCardsServicos("messenger").then((cards)=>{
                        let respostaDF = {
                            "fulfillmentMessages": []
                        }
                        respostaDF.fulfillmentMessages.push({
                            "payload": {
                                "richContent": [[{
                                    "type": "description",
                                    "title": "Bem vindo ao Petshop X!",
                                    "text": [
                                        "Estamos muito felizes em ter você por aqui!",
                                        "Esses são nossos serviços: \n"
                                    ]
                                }]]
                            }
                        });
                        respostaDF.fulfillmentMessages[0].payload.richContent[0].push(...cards);
                        respostaDF.fulfillmentMessages[0].payload.richContent[0].push({
                            "type": "description",
                            "title": "Qual serviço você deseja?",
                            "text": []
                        });
                        resposta.json(respostaDF);
                    }).catch((erro)=>{
                        let respostaDF = {
                            "fulfillmentMessages": []
                        }
                        respostaDF.fulfillmentMessages.push({
                            "payload": {
                                "richContent": [[{
                                    "type": "description",
                                    "title": "Bem vindo ao Petshop X!",
                                    "text": [
                                        "Estamos muito felizes em ter você por aqui!",
                                        "Infelizmente não foi possível recuperar a lista de serviços. \n",
                                        "O sistema está com problemas. \n",
                                    ]
                                }]]
                            }
                        });
                        resposta.status(200).json(respostaDF);
                    })
                }
            } //processar outra intenção
            else if (nomeIntencao == "ColetarDemanda"){
                //coletar os serviços e suas respectivas quantidades 
                console.log("ColetarDemanda");
                //armazenar as escolhas do usuário temporariamente
                //o backend não funciona exclusivamente para um único usuário.
                //Podemos receber ao mesmo tempo requisições de vários usuários que 
                //estão utilizando o chatbot.
                //Será necessário distinguir as opções para cada usuário.
                if (!global.demanda){
                    global.demanda = {};
                }
                //const sessaoUsuario = dados.queryResult.intent.name.split("/")[4];
                const sessaoUsuario = dados.session.split("/")[4];
                if (!global.demanda[sessaoUsuario]){
                    global.demanda[sessaoUsuario] = {
                        servicos: [],
                        quantidades: []
                    }
                }

                const servicosJaColetados = global.demanda[sessaoUsuario].servicos;
                const qtdsJaColetadas = global.demanda[sessaoUsuario].quantidades;
                const novosServicos = dados.queryResult.parameters.servico;
                const novasQuantidades = dados.queryResult.parameters.number;
                global.demanda[sessaoUsuario].servicos = [...servicosJaColetados, ...novosServicos];
                global.demanda[sessaoUsuario].quantidades = [...qtdsJaColetadas, ...novasQuantidades];

            }
            else if (nomeIntencao == "ConfirmacaoAtendimento"){

                //Nós temos até agora memorizadas as escolhas do usuário
                //Nos queremos daqui em diante registrar o pedido desse usuário
                //Armazenando o seu nome, seu telefone, seu endereço e suas escolhas.

                const nomeUsuario = dados.queryResult.outputContexts[0].parameters['person.original'][0];
                const telefoneUsuario = dados.queryResult.outputContexts[0].parameters['phone-number'];
                const enderecoUsuario = dados.queryResult.outputContexts[0].parameters['street-address.original'];
                //const sessaoUsuario = dados.queryResult.intent.name.split("/")[4];
                const sessaoUsuario = dados.session.split("/")[4];
                const listaItens = [];
                for (let i = 0; i < global.demanda[sessaoUsuario].servicos.length; i++){
                    const servico = new Servico();
                    const servicoSelecionado = await servico.consultarTitulo(global.demanda[sessaoUsuario].servicos[i]);
                    const qtd = global.demanda[sessaoUsuario].quantidades[i];
                    const itemPedido = new ItemPedido(servicoSelecionado[0], qtd, servicoSelecionado.valorServico);
                    listaItens.push(itemPedido);
                }

                const pedido = new Pedido(0, nomeUsuario, telefoneUsuario, enderecoUsuario, 0, listaItens);
                pedido.gravar().then(()=>{
                    if (origem){
                        let respostaDF = {
                            "fulfillmentMessages": []
                        }
                        respostaDF.fulfillmentMessages.push({
                            "text": {
                                "text": [
                                    "Seu pedido foi registrado com sucesso! \n",
                                    "Pedido nº " + pedido.codigo + ". \n",
                                    "Obrigado pela preferência. \n",
                                ]
                            }
                        });
                        resposta.status(200).json(respostaDF);
                    }
                    else{
                        //resposta  no formato messenger;
                        let respostaDF = {
                            "fulfillmentMessages": []
                        }
                        respostaDF.fulfillmentMessages.push({
                            "payload": {
                                "richContent": [[{
                                    "type": "description",
                                    "title": "Pedido gravado com sucesso!",
                                    "text": [
                                        "Pedido nº " + pedido.codigo + ". \n",
                                        "Obrigado pela preferência. \n",
                                    ]
                                }]]
                            }
                        });
                        resposta.status(200).json(respostaDF);
                    }
                }).catch((erro) => {
                    if (origem){
                        let respostaDF = {
                            "fulfillmentMessages": []
                        }
                        respostaDF.fulfillmentMessages.push({
                            "text": {
                                "text": [
                                    "Não foi possível registrar o seu pedido! \n",
                                    "Entre em contato conosco pelo whatsapp. \n",
                                    "Erro: " + erro.message
                                ]
                            }
                        });
                        resposta.status(200).json(respostaDF);
                    }
                    else{
                        //resposta  no formato messenger;
                        let respostaDF = {
                            "fulfillmentMessages": []
                        }
                        respostaDF.fulfillmentMessages.push({
                            "payload": {
                                "richContent": [[{
                                    "type": "description",
                                    "title": "Não foi possível registrar seu pedido!",
                                    "text": [
                                        "Entre com contato conosco pelo whatsapp! \n",
                                        "Erro: " + erro.message
                                    ]
                                }]]
                            }
                        });
                        resposta.status(200).json(respostaDF);
                    }

                });
            }

        }

    }
}