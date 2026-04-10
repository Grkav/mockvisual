// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Prioridade = "A" | "B" | "C" | "D" | "E" | "F";
export type StatusPedido =
  | "Não Programado"
  | "Pendente"
  | "Cancelado"
  | "Programado"
  | "Parcialmente Embarcado"
  | "Embarcado"
  | "Em Trânsito"
  | "No Cliente"
  | "Com Ressalvas"
  | "Entregue";

export type TipoRessalva = "No Item" | "No Pedido" | null;
export type StatusTarefa = "Pendente" | "Em Andamento" | "Concluída" | "Atrasada";

export interface Volume {
  id: string;
  nVolume: string;
  indiceEmbarque: number;
  horaEmbarque: string;
  horaDesembarque: string;
  horaEntrega: string;
  rota: string;
  tarefaRetirada: string;
  embarcado: boolean;
}

export interface Item {
  id: string;
  idExterno: string;
  nomeProduto: string;
  lote: string;
  validade: string;
  qtdSolicitada: number;
  qtdEmbarcada: number;
  qtdEntregue: number;
  qtdRessalva: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Comprovante {
  id: string;
  tipo: string;
  arquivo: string;
  dataHora: string;
  usuario: string;
}

export interface Ressalva {
  id: string;
  tipo: string;
  descricao: string;
  dataHora: string;
  usuario: string;
  status: string;
  temFoto: boolean;
  arquivoFoto?: string;
}

export interface ValidacaoOperacional {
  entregaRoterizada: boolean;
  volumeEmbarcadoVal: boolean;
  registroEntrega: boolean;
  chegadaSaidaInformada: boolean;
  ordemRoteirizacao: boolean;
  rotaFinalizada: boolean;
  pedidoNaoProgramado: boolean;
}

export interface Pedido {
  id: string;
  nPedido: string;
  nRemessa: string;
  operacao: string;
  cliente: string;
  rota: string;
  tipoServico: string;
  dataAgendada: string;
  volumeEmbarcado: string;
  qtdVolumes: number;
  qtdVolumesTotal: number;
  peso: number;
  cubagem: number;
  valorTotal: number;
  status: StatusPedido;
  prioridade: Prioridade;
  placa: string;
  motorista: string;
  ajudante: string;
  comComprovante: boolean;
  tipoRessalva: TipoRessalva;
  nomeTarefa: string;
  validacao: ValidacaoOperacional;
  volumes: Volume[];
  itens: Item[];
  comprovantes: Comprovante[];
  ressalvas: Ressalva[];
}

export interface Veiculo {
  id: string;
  placa: string;
  classe: string;
  tipoClimatizacao: string;
  operacao: string;
  motorista: string;
  ajudante: string;
  transportadora: string;
  status: string;
  roteirizado: boolean;
  dataRoteirizacao: string;
  volumeEmbarcado: string;
  qtdPedidos: number;
  qtdTarefas: number;
  statusOperacional: string;
  temRessalva: boolean;
  comComprovante: boolean;
  cliente: string;
  valorTotal: number;
  lat: number;
  lng: number;
  validacao: ValidacaoOperacional;
  pedidos: Pedido[];
}

export interface Deslocamento {
  id: string;
  ordem: number;
  origem: string;
  destino: string;
  horarioInicial: string;
  horarioFinal: string;
  kmInicial: number;
  kmFinal: number;
  kmInformado: number;
  kmEstimado: number;
  diferencaKm: number;
}

export interface Pausa {
  id: string;
  motivo: string;
  observacao: string;
  inicio: string;
  fim: string;
}

export interface Pedagio {
  id: string;
  concessionaria: string;
  endereco: string;
  dataHora: string;
  valor: number;
}

export interface ParadaTimeline {
  nome: string;
  tipo: "galpao" | "cliente" | "destino";
  entrada: string;
  saida: string;
  permanencia: string;
}

export interface Tarefa {
  id: string;
  idTarefa: string;
  ordem: number;
  operacao: string;
  veiculo: string;
  motorista: string;
  ajudante: string;
  roteirizado: boolean;
  dataRoteirizacao: string;
  status: StatusTarefa;
  concluida: boolean;
  inicioPrevisto: string;
  inicio: string;
  termino: string;
  atual: string;
  proximoCliente: string;
  nPedidos: number;
  listaPedidos: string[];
  qtdVolumes: string;
  temRessalva: boolean;
  tipoRessalva: TipoRessalva;
  comComprovante: boolean;
  peso: number;
  cubagem: number;
  valorTotal: number;
  validacao: ValidacaoOperacional;
  deslocamentos: Deslocamento[];
  pausas: Pausa[];
  pedagios: Pedagio[];
  timeline: ParadaTimeline[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeVolumes(pedidoId: string, qtd: number, tarefaRetirada: string, qtdEmbarcados: number = qtd): Volume[] {
  return Array.from({ length: qtd }, (_, i) => {
    const foiEmbarcado = i < qtdEmbarcados;
    return {
      id: `${pedidoId}-vol-${i + 1}`,
      nVolume: String((i % 3) + 1).padStart(2, "0"),
      indiceEmbarque: i + 1,
      horaEmbarque: foiEmbarcado ? `0${6 + i}:${String(Math.floor(Math.random() * 59)).padStart(2, "0")}` : "",
      horaDesembarque: foiEmbarcado ? `${9 + i}:${String(Math.floor(Math.random() * 59)).padStart(2, "0")}` : "",
      horaEntrega: foiEmbarcado ? `${10 + i}:${String(Math.floor(Math.random() * 59)).padStart(2, "0")}` : "",
      rota: foiEmbarcado ? `ROTA-${String(i + 1).padStart(3, "0")}` : "",
      tarefaRetirada: foiEmbarcado ? (i % 3 === 0 ? tarefaRetirada : i % 3 === 1 ? `${tarefaRetirada}-RET` : `RET-${pedidoId}-${i + 1}`) : "",
      embarcado: foiEmbarcado,
    };
  });
}

function makeItens(pedidoId: string, tipoRessalva: TipoRessalva, status: StatusPedido): Item[] {
  const produtos = ["Caixa de Leite", "Suco Integral", "Água Mineral", "Refrigerante", "Iogurte", "Biscoito"];
  return produtos.slice(0, 3 + (parseInt(pedidoId.replace(/\D/g, "")) % 3)).map((nome, i) => {
    const qtdS = 10 + i * 5;
    const isNoItemRessalva = tipoRessalva === "No Item" && status === "Com Ressalvas";
    const hasEntrega = status === "Entregue" || status === "Com Ressalvas";
    const hasEmbarqueParcial = status === "Parcialmente Embarcado";
    const hasEmbarqueTotal = status === "Embarcado" || status === "sito" || status === "No Cliente";
    let qtdE = 0;
    if (hasEntrega || hasEmbarqueTotal) qtdE = qtdS;
    if (hasEmbarqueParcial) qtdE = Math.max(0, qtdS - (i === 0 ? 2 : 1));
    let qtdEnt = hasEntrega ? qtdE : 0;
    if (isNoItemRessalva && i === 1) qtdEnt = Math.max(0, qtdE - 2);
    const qtdR = isNoItemRessalva ? Math.max(0, qtdE - qtdEnt) : 0;
    const vu = 12.5 + i * 3.2;
    return {
      id: `ITEM-${pedidoId}-${i + 1}`,
      idExterno: `EXT-${10000 + i}`,
      nomeProduto: nome,
      lote: `LOT${String(2024 + i)}`,
      validade: `2025-${String(6 + i).padStart(2, "0")}-30`,
      qtdSolicitada: qtdS,
      qtdEmbarcada: qtdE,
      qtdEntregue: qtdEnt,
      qtdRessalva: qtdR,
      valorUnitario: vu,
      valorTotal: qtdEnt * vu,
    };
  });
}

function makeComprovantes(pedidoId: string, tem: boolean): Comprovante[] {
  if (!tem) return [];
  return [
    {
      id: `COMP-${pedidoId}-1`,
      tipo: "Foto",
      arquivo: `foto_entrega_${pedidoId}.jpg`,
      dataHora: "2025-03-25 10:42",
      usuario: "João Silva",
    },
    {
      id: `COMP-${pedidoId}-2`,
      tipo: "Assinatura",
      arquivo: `assinatura_${pedidoId}.pdf`,
      dataHora: "2025-03-25 10:44",
      usuario: "João Silva",
    },
    {
      id: `COMP-${pedidoId}-3`,
      tipo: "Biometria Facial",
      arquivo: `biometria_facial_${pedidoId}.jpg`,
      dataHora: "2025-03-25 10:45",
      usuario: "João Silva",
    },
  ];
}

function makeRessalvas(pedidoId: string, tipo: TipoRessalva): Ressalva[] {
  if (!tipo) return [];
  const fotosPorPedido: Record<string, boolean> = {
    P003: false,
    P004: true,
    P008: false,
    P011: true,
  };
  const temFoto = fotosPorPedido[pedidoId] ?? false;
  return [
    {
      id: `RES-${pedidoId}-1`,
      tipo: tipo === "No Pedido" ? "Ausência no Recebimento" : "Avaria",
      descricao: tipo === "No Pedido" ? "Ninguém está presente para recebimento" : "Item com avaria no transporte",
      dataHora: "2025-03-25 11:15",
      usuario: "Carlos Rocha",
      status: "Aberta",
      temFoto,
      arquivoFoto: temFoto ? `foto_ressalva_${pedidoId}.jpg` : undefined,
    },
  ];
}

// ─── Pedidos Base ─────────────────────────────────────────────────────────────

const PEDIDOS_DATA: Omit<Pedido, "volumes" | "itens" | "comprovantes" | "ressalvas">[] = [
  { id: "P001", nPedido: "PED-001", nRemessa: "REM-0001", operacao: "SP-Capital", cliente: "Supermercado Bom Preço", rota: "ROTA-001", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "5/5", qtdVolumes: 5, qtdVolumesTotal: 5, peso: 320.5, cubagem: 1.8, valorTotal: 4520.00, status: "Entregue", prioridade: "A", placa: "ABC-1234", motorista: "João Silva", ajudante: "Pedro Alves", comComprovante: true, tipoRessalva: null, nomeTarefa: "TASK-001", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: true, pedidoNaoProgramado: false } },
  { id: "P002", nPedido: "PED-002", nRemessa: "REM-0002", operacao: "SP-Capital", cliente: "Supermercado Bom Preço", rota: "ROTA-002", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "2/3", qtdVolumes: 2, qtdVolumesTotal: 3, peso: 120.0, cubagem: 0.6, valorTotal: 1400.00, status: "Programado", prioridade: "B", placa: "ABC-1234", motorista: "João Silva", ajudante: "Pedro Alves", comComprovante: false, tipoRessalva: null, nomeTarefa: "TASK-001", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P003", nPedido: "PED-003", nRemessa: "REM-0003", operacao: "SP-Capital", cliente: "Distribuidora Alfa", rota: "ROTA-003", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "2/4", qtdVolumes: 2, qtdVolumesTotal: 4, peso: 95.0, cubagem: 0.5, valorTotal: 1350.00, status: "Com Ressalvas", prioridade: "C", placa: "ABC-1234", motorista: "João Silva", ajudante: "Pedro Alves", comComprovante: false, tipoRessalva: "No Item", nomeTarefa: "TASK-001", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P004", nPedido: "PED-004", nRemessa: "REM-0004", operacao: "ABC-Guarulhos", cliente: "Padaria Pão Quente", rota: "ROTA-004", tipoServico: "COLETA", dataAgendada: "25/03/2025", volumeEmbarcado: "6/6", qtdVolumes: 6, qtdVolumesTotal: 6, peso: 410.0, cubagem: 2.1, valorTotal: 5800.00, status: "Com Ressalvas", prioridade: "A", placa: "DEF-5678", motorista: "Carlos Rocha", ajudante: "Marcos Lima", comComprovante: false, tipoRessalva: "No Pedido", nomeTarefa: "TASK-002", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P005", nPedido: "PED-005", nRemessa: "REM-0005", operacao: "ABC-Guarulhos", cliente: "Restaurante Sabor & Arte", rota: "ROTA-005", tipoServico: "RETIRADA", dataAgendada: "25/03/2025", volumeEmbarcado: "3/4", qtdVolumes: 3, qtdVolumesTotal: 4, peso: 172.5, cubagem: 0.9, valorTotal: 2400.00, status: "Em Trânsito", prioridade: "B", placa: "DEF-5678", motorista: "Carlos Rocha", ajudante: "Marcos Lima", comComprovante: true, tipoRessalva: null, nomeTarefa: "TASK-002", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P006", nPedido: "PED-006", nRemessa: "REM-0006", operacao: "ABC-Guarulhos", cliente: "Atacado Norte", rota: "ROTA-006", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "0/8", qtdVolumes: 0, qtdVolumesTotal: 8, peso: 0, cubagem: 0, valorTotal: 7200.00, status: "Programado", prioridade: "C", placa: "DEF-5678", motorista: "Carlos Rocha", ajudante: "Marcos Lima", comComprovante: false, tipoRessalva: null, nomeTarefa: "TASK-003", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P007", nPedido: "PED-007", nRemessa: "REM-0007", operacao: "RJ-Centro", cliente: "Farmácia Saúde Total", rota: "ROTA-007", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "3/3", qtdVolumes: 3, qtdVolumesTotal: 3, peso: 145.0, cubagem: 0.7, valorTotal: 1980.00, status: "Entregue", prioridade: "A", placa: "GHI-9012", motorista: "Andre Costa", ajudante: "Fábio Nunes", comComprovante: false, tipoRessalva: null, nomeTarefa: "TASK-004", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: true, pedidoNaoProgramado: false } },
  { id: "P008", nPedido: "PED-008", nRemessa: "REM-0008", operacao: "RJ-Centro", cliente: "Loja Mega Eletro", rota: "ROTA-008", tipoServico: "RETIRADA", dataAgendada: "25/03/2025", volumeEmbarcado: "1/1", qtdVolumes: 1, qtdVolumesTotal: 1, peso: 80.0, cubagem: 0.4, valorTotal: 890.00, status: "Com Ressalvas", prioridade: "D", placa: "GHI-9012", motorista: "Andre Costa", ajudante: "Fábio Nunes", comComprovante: false, tipoRessalva: "No Pedido", nomeTarefa: "TASK-004", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P009", nPedido: "PED-009", nRemessa: "REM-0009", operacao: "MG-BH", cliente: "Distribuidora Sul", rota: "ROTA-009", tipoServico: "COLETA", dataAgendada: "25/03/2025", volumeEmbarcado: "0/5", qtdVolumes: 0, qtdVolumesTotal: 5, peso: 0, cubagem: 0, valorTotal: 4100.00, status: "Não Programado", prioridade: "E", placa: "JKL-3456", motorista: "Roberto Mendes", ajudante: "Sandro Cruz", comComprovante: false, tipoRessalva: null, nomeTarefa: "TASK-005", validacao: { entregaRoterizada: false, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: true } },
  { id: "P010", nPedido: "PED-010", nRemessa: "REM-0010", operacao: "MG-BH", cliente: "Hipermercado Barato", rota: "ROTA-010", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "0/12", qtdVolumes: 0, qtdVolumesTotal: 12, peso: 0, cubagem: 0, valorTotal: 9500.00, status: "Cancelado", prioridade: "F", placa: "JKL-3456", motorista: "Roberto Mendes", ajudante: "Sandro Cruz", comComprovante: false, tipoRessalva: null, nomeTarefa: "TASK-005", validacao: { entregaRoterizada: false, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P011", nPedido: "PED-011", nRemessa: "REM-0011", operacao: "SP-Capital", cliente: "Mini Mercado Estrela", rota: "ROTA-011", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "1/2", qtdVolumes: 1, qtdVolumesTotal: 2, peso: 110.0, cubagem: 0.6, valorTotal: 1620.00, status: "Entregue", prioridade: "B", placa: "MNO-7890", motorista: "Rodrigo Pires", ajudante: "Wagner Souza", comComprovante: true, tipoRessalva: "No Item", nomeTarefa: "TASK-006", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: false, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: true, pedidoNaoProgramado: false } },
  { id: "P012", nPedido: "PED-012", nRemessa: "REM-0012", operacao: "SP-Capital", cliente: "Supermercado Família", rota: "ROTA-012", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "7/7", qtdVolumes: 7, qtdVolumesTotal: 7, peso: 560.0, cubagem: 2.8, valorTotal: 8200.00, status: "Entregue", prioridade: "A", placa: "MNO-7890", motorista: "Rodrigo Pires", ajudante: "Wagner Souza", comComprovante: true, tipoRessalva: null, nomeTarefa: "TASK-006", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: true, pedidoNaoProgramado: false } },
  { id: "P013", nPedido: "PED-013", nRemessa: "REM-0013", operacao: "SP-Capital", cliente: "Distribuidora Alfa", rota: "ROTA-013", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "3/3", qtdVolumes: 3, qtdVolumesTotal: 3, peso: 180.0, cubagem: 0.9, valorTotal: 2100.00, status: "Entregue", prioridade: "A", placa: "PQR-1122", motorista: "Mateus Lima", ajudante: "Igor Santos", comComprovante: true, tipoRessalva: null, nomeTarefa: "TASK-007", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P014", nPedido: "PED-014", nRemessa: "REM-0014", operacao: "SP-Capital", cliente: "Mini Mercado Estrela", rota: "ROTA-014", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "2/2", qtdVolumes: 2, qtdVolumesTotal: 2, peso: 140.0, cubagem: 0.7, valorTotal: 1750.00, status: "Entregue", prioridade: "B", placa: "PQR-1122", motorista: "Mateus Lima", ajudante: "Igor Santos", comComprovante: true, tipoRessalva: null, nomeTarefa: "TASK-007", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P015", nPedido: "PED-015", nRemessa: "REM-0015", operacao: "SP-Capital", cliente: "Loja Mega Eletro", rota: "ROTA-015", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "1/1", qtdVolumes: 1, qtdVolumesTotal: 1, peso: 85.0, cubagem: 0.4, valorTotal: 980.00, status: "Entregue", prioridade: "C", placa: "PQR-1122", motorista: "Mateus Lima", ajudante: "Igor Santos", comComprovante: true, tipoRessalva: null, nomeTarefa: "TASK-007", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P016", nPedido: "PED-016", nRemessa: "REM-0016", operacao: "SP-Capital", cliente: "Atacado Norte", rota: "ROTA-016", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "0/6", qtdVolumes: 0, qtdVolumesTotal: 6, peso: 0, cubagem: 0, valorTotal: 4600.00, status: "Programado", prioridade: "B", placa: "PQR-1122", motorista: "Mateus Lima", ajudante: "Igor Santos", comComprovante: false, tipoRessalva: null, nomeTarefa: "TASK-007", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P017", nPedido: "PED-017", nRemessa: "REM-0017", operacao: "SP-Capital", cliente: "Hipermercado Barato", rota: "ROTA-017", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "0/4", qtdVolumes: 0, qtdVolumesTotal: 4, peso: 0, cubagem: 0, valorTotal: 3200.00, status: "Programado", prioridade: "D", placa: "PQR-1122", motorista: "Mateus Lima", ajudante: "Igor Santos", comComprovante: false, tipoRessalva: null, nomeTarefa: "TASK-007", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
  { id: "P018", nPedido: "PED-018", nRemessa: "REM-0018", operacao: "SP-Capital", cliente: "Atacado Norte", rota: "ROTA-018", tipoServico: "ENTREGA", dataAgendada: "25/03/2025", volumeEmbarcado: "3/4", qtdVolumes: 3, qtdVolumesTotal: 4, peso: 210.0, cubagem: 1.0, valorTotal: 2950.00, status: "Parcialmente Embarcado", prioridade: "B", placa: "STU-3344", motorista: "Lucas Ferreira", ajudante: "Caio Ramos", comComprovante: false, tipoRessalva: null, nomeTarefa: "TASK-008", validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false } },
];

export const PEDIDOS: Pedido[] = PEDIDOS_DATA.map((p) => ({
  ...p,
  volumes: makeVolumes(p.id, p.qtdVolumesTotal, p.nomeTarefa, p.qtdVolumes),
  itens: makeItens(p.id, p.tipoRessalva, p.status),
  comprovantes: makeComprovantes(p.id, p.comComprovante),
  ressalvas: makeRessalvas(p.id, p.tipoRessalva),
}));

// ─── Veículos ────────────────────────────────────────────────────────────────

export const VEICULOS: Veiculo[] = [
  {
    id: "V001", placa: "ABC-1234", classe: "CARRETA 25T", tipoClimatizacao: "Seco", operacao: "SP-Capital",
    motorista: "João Silva", ajudante: "Pedro Alves", transportadora: "AGREGADO",
    status: "Em Rota", roteirizado: true, dataRoteirizacao: "25/03/2025 05:30",
    volumeEmbarcado: "10/12", qtdPedidos: 3, qtdTarefas: 2, statusOperacional: "Em Trânsito",
    temRessalva: true, comComprovante: true, cliente: "Supermercado Bom Preço", valorTotal: 7970.00,
    lat: -23.5505, lng: -46.6333,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false },
    pedidos: PEDIDOS.filter((p) => p.placa === "ABC-1234"),
  },
  {
    id: "V002", placa: "DEF-5678", classe: "FIORINO CARGO", tipoClimatizacao: "Refrigerado", operacao: "ABC-Guarulhos",
    motorista: "Carlos Rocha", ajudante: "Marcos Lima", transportadora: "FROTA",
    status: "No Cliente", roteirizado: true, dataRoteirizacao: "25/03/2025 05:45",
    volumeEmbarcado: "10/18", qtdPedidos: 3, qtdTarefas: 2, statusOperacional: "No Cliente",
    temRessalva: true, comComprovante: false, cliente: "Padaria Pão Quente", valorTotal: 16200.00,
    lat: -23.4539, lng: -46.5265,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: false },
    pedidos: PEDIDOS.filter((p) => p.placa === "DEF-5678"),
  },
  {
    id: "V003", placa: "GHI-9012", classe: "VUC BAU", tipoClimatizacao: "Seco", operacao: "RJ-Centro",
    motorista: "Andre Costa", ajudante: "Fábio Nunes", transportadora: "SPOT",
    status: "Finalizado", roteirizado: true, dataRoteirizacao: "25/03/2025 04:00",
    volumeEmbarcado: "4/4", qtdPedidos: 2, qtdTarefas: 1, statusOperacional: "Concluído",
    temRessalva: true, comComprovante: false, cliente: "Farmácia Saúde Total", valorTotal: 2870.00,
    lat: -22.9068, lng: -43.1729,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: true, pedidoNaoProgramado: false },
    pedidos: PEDIDOS.filter((p) => p.placa === "GHI-9012"),
  },
  {
    id: "V004", placa: "JKL-3456", classe: "TRUCK 16T", tipoClimatizacao: "Congelado", operacao: "MG-BH",
    motorista: "Roberto Mendes", ajudante: "Sandro Cruz", transportadora: "FROTA",
    status: "Aguardando", roteirizado: false, dataRoteirizacao: "",
    volumeEmbarcado: "0/17", qtdPedidos: 2, qtdTarefas: 1, statusOperacional: "Aguardando",
    temRessalva: false, comComprovante: false, cliente: "-", valorTotal: 13600.00,
    lat: -19.9191, lng: -43.9386,
    validacao: { entregaRoterizada: false, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: true },
    pedidos: PEDIDOS.filter((p) => p.placa === "JKL-3456"),
  },
  {
    id: "V005", placa: "MNO-7890", classe: "TOCO 10T", tipoClimatizacao: "Seco", operacao: "SP-Capital",
    motorista: "Rodrigo Pires", ajudante: "Wagner Souza", transportadora: "AGREGADO",
    status: "Finalizado", roteirizado: true, dataRoteirizacao: "25/03/2025 06:00",
    volumeEmbarcado: "9/9", qtdPedidos: 2, qtdTarefas: 2, statusOperacional: "Concluído",
    temRessalva: true, comComprovante: true, cliente: "Supermercado Família", valorTotal: 9820.00,
    lat: -23.5329, lng: -46.6395,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: true, pedidoNaoProgramado: false },
    pedidos: PEDIDOS.filter((p) => p.placa === "MNO-7890"),
  },
  {
    id: "V006", placa: "PQR-1122", classe: "CARRETA LS", tipoClimatizacao: "Seco", operacao: "SP-Capital",
    motorista: "Mateus Lima", ajudante: "Igor Santos", transportadora: "FROTA",
    status: "No Cliente", roteirizado: true, dataRoteirizacao: "25/03/2025 05:20",
    volumeEmbarcado: "6/16", qtdPedidos: 5, qtdTarefas: 1, statusOperacional: "No Cliente",
    temRessalva: false, comComprovante: true, cliente: "Atacado Norte", valorTotal: 12630.00,
    lat: -23.4711, lng: -46.5414,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false },
    pedidos: PEDIDOS.filter((p) => p.placa === "PQR-1122"),
  },
  {
    id: "V007", placa: "STU-3344", classe: "3/4 CARGA", tipoClimatizacao: "Seco", operacao: "SP-Capital",
    motorista: "Lucas Ferreira", ajudante: "Caio Ramos", transportadora: "FROTA",
    status: "Em Rota", roteirizado: true, dataRoteirizacao: "25/03/2025 06:10",
    volumeEmbarcado: "3/4", qtdPedidos: 1, qtdTarefas: 1, statusOperacional: "Embarcando",
    temRessalva: false, comComprovante: false, cliente: "Atacado Norte", valorTotal: 2950.00,
    lat: -23.495, lng: -46.568,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false },
    pedidos: PEDIDOS.filter((p) => p.placa === "STU-3344"),
  },
];

// ─── Tarefas ─────────────────────────────────────────────────────────────────

export const TAREFAS: Tarefa[] = [
  {
    id: "T001", idTarefa: "TASK-001", ordem: 1, operacao: "SP-Capital", veiculo: "ABC-1234",
    motorista: "João Silva", ajudante: "Pedro Alves", roteirizado: true,
    dataRoteirizacao: "25/03/2025 05:30", status: "Em Andamento", concluida: false,
    inicioPrevisto: "06:00", inicio: "06:15", termino: "", atual: "Supermercado Bom Preço",
    proximoCliente: "Distribuidora Alfa", nPedidos: 3,
    listaPedidos: ["PED-001", "PED-002", "PED-003"],
    qtdVolumes: "10/12", temRessalva: true, tipoRessalva: "No Item", comComprovante: true,
    peso: 595.5, cubagem: 3.2, valorTotal: 7970.00,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false },
    deslocamentos: [
      { id: "D001", ordem: 1, origem: "Galpão SP", destino: "Supermercado Bom Preço", horarioInicial: "06:15", horarioFinal: "07:40", kmInicial: 120500, kmFinal: 120538, kmInformado: 38, kmEstimado: 35, diferencaKm: 3 },
      { id: "D002", ordem: 2, origem: "Supermercado Bom Preço", destino: "Distribuidora Alfa", horarioInicial: "08:10", horarioFinal: "", kmInicial: 120538, kmFinal: 0, kmInformado: 0, kmEstimado: 22, diferencaKm: 0 },
    ],
    pausas: [
      { id: "PA001", motivo: "Almoço", observacao: "Parada para refeição", inicio: "12:00", fim: "12:45" },
      { id: "PA002", motivo: "Abastecimento", observacao: "Posto Shell – Rod. Anhanguera", inicio: "07:50", fim: "08:10" },
    ],
    pedagios: [
      { id: "PG001", concessionaria: "AutoBan", endereco: "Rod. Anhanguera, KM 23", dataHora: "2025-03-25 06:30", valor: 8.50 },
      { id: "PG002", concessionaria: "AutoBan", endereco: "Rod. Anhanguera, KM 48", dataHora: "2025-03-25 07:10", valor: 8.50 },
    ],
    timeline: [
      { nome: "Galpão SP", tipo: "galpao", entrada: "06:15", saida: "06:15", permanencia: "0 min" },
      { nome: "Supermercado Bom Preço", tipo: "cliente", entrada: "07:40", saida: "08:10", permanencia: "30 min" },
      { nome: "Distribuidora Alfa", tipo: "cliente", entrada: "10:30", saida: "", permanencia: "em curso" },
    ],
  },
  {
    id: "T002", idTarefa: "TASK-002", ordem: 2, operacao: "ABC-Guarulhos", veiculo: "DEF-5678",
    motorista: "Carlos Rocha", ajudante: "Marcos Lima", roteirizado: true,
    dataRoteirizacao: "25/03/2025 05:45", status: "Em Andamento", concluida: false,
    inicioPrevisto: "06:30", inicio: "06:40", termino: "", atual: "Padaria Pão Quente",
    proximoCliente: "Restaurante Sabor & Arte", nPedidos: 2,
    listaPedidos: ["PED-004", "PED-005"],
    qtdVolumes: "10/10", temRessalva: true, tipoRessalva: "No Pedido", comComprovante: true,
    peso: 640.0, cubagem: 3.3, valorTotal: 9000.00,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: false },
    deslocamentos: [
      { id: "D004", ordem: 1, origem: "Galpão Guarulhos", destino: "Padaria Pão Quente", horarioInicial: "06:40", horarioFinal: "07:55", kmInicial: 85200, kmFinal: 85242, kmInformado: 42, kmEstimado: 40, diferencaKm: 2 },
      { id: "D005", ordem: 2, origem: "Padaria Pão Quente", destino: "Restaurante Sabor & Arte", horarioInicial: "09:00", horarioFinal: "", kmInicial: 85242, kmFinal: 0, kmInformado: 0, kmEstimado: 15, diferencaKm: 0 },
    ],
    pausas: [
      { id: "PA003", motivo: "Manutenção", observacao: "Verificação de pneu", inicio: "11:00", fim: "11:20" },
    ],
    pedagios: [
      { id: "PG003", concessionaria: "Ecovias", endereco: "Rod. dos Imigrantes, KM 10", dataHora: "2025-03-25 07:00", valor: 12.20 },
    ],
    timeline: [
      { nome: "Galpão Guarulhos", tipo: "galpao", entrada: "06:40", saida: "06:40", permanencia: "0 min" },
      { nome: "Padaria Pão Quente", tipo: "cliente", entrada: "07:55", saida: "09:00", permanencia: "65 min" },
      { nome: "Restaurante Sabor & Arte", tipo: "destino", entrada: "09:52", saida: "", permanencia: "em curso" },
    ],
  },
  {
    id: "T003", idTarefa: "TASK-003", ordem: 3, operacao: "ABC-Guarulhos", veiculo: "DEF-5678",
    motorista: "Carlos Rocha", ajudante: "Marcos Lima", roteirizado: true,
    dataRoteirizacao: "25/03/2025 05:45", status: "Pendente", concluida: false,
    inicioPrevisto: "14:00", inicio: "", termino: "", atual: "-",
    proximoCliente: "Atacado Norte", nPedidos: 1,
    listaPedidos: ["PED-006"],
    qtdVolumes: "0/8", temRessalva: false, tipoRessalva: null, comComprovante: false,
    peso: 0, cubagem: 0, valorTotal: 7200.00,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: false },
    deslocamentos: [],
    pausas: [],
    pedagios: [],
    timeline: [],
  },
  {
    id: "T004", idTarefa: "TASK-004", ordem: 4, operacao: "RJ-Centro", veiculo: "GHI-9012",
    motorista: "Andre Costa", ajudante: "Fábio Nunes", roteirizado: true,
    dataRoteirizacao: "25/03/2025 04:00", status: "Concluída", concluida: true,
    inicioPrevisto: "05:00", inicio: "05:10", termino: "11:30", atual: "Galpão RJ",
    proximoCliente: "-", nPedidos: 2,
    listaPedidos: ["PED-007", "PED-008"],
    qtdVolumes: "4/4", temRessalva: true, tipoRessalva: "No Pedido", comComprovante: false,
    peso: 225.0, cubagem: 1.1, valorTotal: 2870.00,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: true, pedidoNaoProgramado: false },
    deslocamentos: [
      { id: "D006", ordem: 1, origem: "Galpão RJ", destino: "Farmácia Saúde Total", horarioInicial: "05:10", horarioFinal: "06:20", kmInicial: 55000, kmFinal: 55040, kmInformado: 40, kmEstimado: 38, diferencaKm: 2 },
      { id: "D007", ordem: 2, origem: "Farmácia Saúde Total", destino: "Loja Mega Eletro", horarioInicial: "07:05", horarioFinal: "07:50", kmInicial: 55040, kmFinal: 55060, kmInformado: 20, kmEstimado: 22, diferencaKm: -2 },
      { id: "D008", ordem: 3, origem: "Loja Mega Eletro", destino: "Galpão RJ", horarioInicial: "08:30", horarioFinal: "09:45", kmInicial: 55060, kmFinal: 55100, kmInformado: 40, kmEstimado: 40, diferencaKm: 0 },
    ],
    pausas: [],
    pedagios: [
      { id: "PG004", concessionaria: "Rio Teresópolis", endereco: "BR-040, KM 118", dataHora: "2025-03-25 05:35", valor: 6.80 },
    ],
    timeline: [
      { nome: "Galpão RJ", tipo: "galpao", entrada: "05:10", saida: "05:10", permanencia: "0 min" },
      { nome: "Farmácia Saúde Total", tipo: "cliente", entrada: "06:20", saida: "07:05", permanencia: "45 min" },
      { nome: "Loja Mega Eletro", tipo: "cliente", entrada: "07:50", saida: "08:30", permanencia: "40 min" },
      { nome: "Galpão RJ", tipo: "galpao", entrada: "09:45", saida: "09:45", permanencia: "retorno" },
    ],
  },
  {
    id: "T005", idTarefa: "TASK-005", ordem: 5, operacao: "MG-BH", veiculo: "JKL-3456",
    motorista: "Roberto Mendes", ajudante: "Sandro Cruz", roteirizado: false,
    dataRoteirizacao: "", status: "Pendente", concluida: false,
    inicioPrevisto: "08:00", inicio: "", termino: "", atual: "-",
    proximoCliente: "Distribuidora Sul", nPedidos: 2,
    listaPedidos: ["PED-009", "PED-010"],
    qtdVolumes: "0/17", temRessalva: false, tipoRessalva: null, comComprovante: false,
    peso: 0, cubagem: 0, valorTotal: 13600.00,
    validacao: { entregaRoterizada: false, volumeEmbarcadoVal: false, registroEntrega: false, chegadaSaidaInformada: false, ordemRoteirizacao: false, rotaFinalizada: false, pedidoNaoProgramado: true },
    deslocamentos: [],
    pausas: [],
    pedagios: [],
    timeline: [],
  },
  {
    id: "T006", idTarefa: "TASK-006", ordem: 6, operacao: "SP-Capital", veiculo: "MNO-7890",
    motorista: "Rodrigo Pires", ajudante: "Wagner Souza", roteirizado: true,
    dataRoteirizacao: "25/03/2025 06:00", status: "Concluída", concluida: true,
    inicioPrevisto: "07:00", inicio: "07:05", termino: "13:20", atual: "Galpão SP",
    proximoCliente: "-", nPedidos: 2,
    listaPedidos: ["PED-011", "PED-012"],
    qtdVolumes: "9/9", temRessalva: true, tipoRessalva: "No Item", comComprovante: true,
    peso: 670.0, cubagem: 3.4, valorTotal: 9820.00,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: true, pedidoNaoProgramado: false },
    deslocamentos: [
      { id: "D009", ordem: 1, origem: "Galpão SP", destino: "Mini Mercado Estrela", horarioInicial: "07:05", horarioFinal: "08:00", kmInicial: 200100, kmFinal: 200130, kmInformado: 30, kmEstimado: 28, diferencaKm: 2 },
      { id: "D010", ordem: 2, origem: "Mini Mercado Estrela", destino: "Supermercado Família", horarioInicial: "08:40", horarioFinal: "09:30", kmInicial: 200130, kmFinal: 200162, kmInformado: 32, kmEstimado: 30, diferencaKm: 2 },
      { id: "D011", ordem: 3, origem: "Supermercado Família", destino: "Galpão SP", horarioInicial: "11:10", horarioFinal: "12:05", kmInicial: 200162, kmFinal: 200195, kmInformado: 33, kmEstimado: 35, diferencaKm: -2 },
    ],
    pausas: [
      { id: "PA004", motivo: "Almoço", observacao: "Parada para refeição", inicio: "12:05", fim: "12:50" },
    ],
    pedagios: [
      { id: "PG005", concessionaria: "AutoBan", endereco: "Rod. Bandeirantes, KM 30", dataHora: "2025-03-25 07:20", valor: 9.10 },
    ],
    timeline: [
      { nome: "Galpão SP", tipo: "galpao", entrada: "07:05", saida: "07:05", permanencia: "0 min" },
      { nome: "Mini Mercado Estrela", tipo: "cliente", entrada: "08:00", saida: "08:40", permanencia: "40 min" },
      { nome: "Supermercado Família", tipo: "cliente", entrada: "09:30", saida: "11:10", permanencia: "100 min" },
      { nome: "Galpão SP", tipo: "galpao", entrada: "12:05", saida: "12:05", permanencia: "retorno" },
    ],
  },
  {
    id: "T007", idTarefa: "TASK-007", ordem: 7, operacao: "SP-Capital", veiculo: "PQR-1122",
    motorista: "Mateus Lima", ajudante: "Igor Santos", roteirizado: true,
    dataRoteirizacao: "25/03/2025 05:20", status: "Em Andamento", concluida: false,
    inicioPrevisto: "06:00", inicio: "05:50", termino: "", atual: "Atacado Norte",
    proximoCliente: "Hipermercado Barato", nPedidos: 5,
    listaPedidos: ["PED-013", "PED-014", "PED-015", "PED-016", "PED-017"],
    qtdVolumes: "6/16", temRessalva: false, tipoRessalva: null, comComprovante: true,
    peso: 405.0, cubagem: 2.0, valorTotal: 12630.00,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: true, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false },
    deslocamentos: [
      { id: "D012", ordem: 1, origem: "Galpão SP", destino: "Distribuidora Alfa", horarioInicial: "05:50", horarioFinal: "06:45", kmInicial: 300010, kmFinal: 300040, kmInformado: 30, kmEstimado: 28, diferencaKm: 2 },
      { id: "D013", ordem: 2, origem: "Distribuidora Alfa", destino: "Mini Mercado Estrela", horarioInicial: "07:25", horarioFinal: "08:10", kmInicial: 300040, kmFinal: 300068, kmInformado: 28, kmEstimado: 26, diferencaKm: 2 },
      { id: "D014", ordem: 3, origem: "Mini Mercado Estrela", destino: "Loja Mega Eletro", horarioInicial: "08:45", horarioFinal: "09:30", kmInicial: 300068, kmFinal: 300095, kmInformado: 27, kmEstimado: 25, diferencaKm: 2 },
      { id: "D015", ordem: 4, origem: "Loja Mega Eletro", destino: "Atacado Norte", horarioInicial: "10:05", horarioFinal: "10:55", kmInicial: 300095, kmFinal: 300125, kmInformado: 30, kmEstimado: 29, diferencaKm: 1 },
      { id: "D016", ordem: 5, origem: "Atacado Norte", destino: "Hipermercado Barato", horarioInicial: "10:59", horarioFinal: "", kmInicial: 300125, kmFinal: 0, kmInformado: 0, kmEstimado: 34, diferencaKm: 0 },
    ],
    pausas: [
      { id: "PA005", motivo: "Almoço", observacao: "Parada rápida para refeição", inicio: "12:05", fim: "12:35" },
    ],
    pedagios: [
      { id: "PG006", concessionaria: "AutoBan", endereco: "Rod. Bandeirantes, KM 46", dataHora: "2025-03-25 06:10", valor: 9.10 },
    ],
    timeline: [
      { nome: "Galpão SP", tipo: "galpao", entrada: "05:50", saida: "05:50", permanencia: "0 min" },
      { nome: "Distribuidora Alfa", tipo: "cliente", entrada: "06:45", saida: "07:25", permanencia: "40 min" },
      { nome: "Mini Mercado Estrela", tipo: "cliente", entrada: "08:10", saida: "08:45", permanencia: "35 min" },
      { nome: "Loja Mega Eletro", tipo: "cliente", entrada: "09:30", saida: "10:05", permanencia: "35 min" },
      { nome: "Atacado Norte", tipo: "cliente", entrada: "10:55", saida: "10:59", permanencia: "4 min" },
      { nome: "Hipermercado Barato", tipo: "cliente", entrada: "", saida: "", permanencia: "planejado" },
    ],
  },
  {
    id: "T008", idTarefa: "TASK-008", ordem: 8, operacao: "SP-Capital", veiculo: "STU-3344",
    motorista: "Lucas Ferreira", ajudante: "Caio Ramos", roteirizado: true,
    dataRoteirizacao: "25/03/2025 06:10", status: "Em Andamento", concluida: false,
    inicioPrevisto: "06:30", inicio: "06:25", termino: "", atual: "Galpão SP (bipando volumes para embarque)",
    proximoCliente: "Atacado Norte", nPedidos: 1,
    listaPedidos: ["PED-018"],
    qtdVolumes: "3/4", temRessalva: false, tipoRessalva: null, comComprovante: false,
    peso: 210.0, cubagem: 1.0, valorTotal: 2950.00,
    validacao: { entregaRoterizada: true, volumeEmbarcadoVal: true, registroEntrega: false, chegadaSaidaInformada: true, ordemRoteirizacao: true, rotaFinalizada: false, pedidoNaoProgramado: false },
    deslocamentos: [
      { id: "D017", ordem: 1, origem: "Galpão SP", destino: "Atacado Norte", horarioInicial: "06:25", horarioFinal: "", kmInicial: 145200, kmFinal: 0, kmInformado: 0, kmEstimado: 24, diferencaKm: 0 },
    ],
    pausas: [],
    pedagios: [],
    timeline: [
      { nome: "Galpão SP", tipo: "galpao", entrada: "06:25", saida: "", permanencia: "em embarque" },
      { nome: "Atacado Norte", tipo: "cliente", entrada: "", saida: "", permanencia: "planejado" },
    ],
  },
];

// ─── Cards de status ──────────────────────────────────────────────────────────

export interface CardStatus {
  label: StatusPedido;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function isPedidoParcialmenteEmbarcado(p: Pedido): boolean {
  return p.qtdVolumesTotal > 0 && p.qtdVolumes > 0 && p.qtdVolumes < p.qtdVolumesTotal;
}

export function calcularCards(pedidos: Pedido[]): CardStatus[] {
  const contagem = (status: StatusPedido) => pedidos.filter((p) => p.status === status).length;
  const comRessalvas = pedidos.filter((p) => p.tipoRessalva !== null || p.ressalvas.length > 0).length;
  const parcialmenteEmbarcados = pedidos.filter((p) => isPedidoParcialmenteEmbarcado(p)).length;
  return [
    { label: "Não Programado", count: contagem("Não Programado"), color: "text-slate-700", bgColor: "bg-slate-100", borderColor: "border-slate-300" },
    { label: "Pendente", count: contagem("Pendente"), color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-300" },
    { label: "Programado", count: contagem("Programado"), color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300" },
    { label: "Parcialmente Embarcado", count: parcialmenteEmbarcados, color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-300" },
    { label: "Embarcado", count: contagem("Embarcado"), color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-300" },
    { label: "Em Trânsito", count: contagem("Em Trânsito"), color: "text-cyan-700", bgColor: "bg-cyan-50", borderColor: "border-cyan-300" },
    { label: "No Cliente", count: contagem("No Cliente"), color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-300" },
    { label: "Com Ressalvas", count: comRessalvas, color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300" },
    { label: "Entregue", count: contagem("Entregue"), color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-300" },
    { label: "Cancelado", count: contagem("Cancelado"), color: "text-zinc-700", bgColor: "bg-zinc-100", borderColor: "border-zinc-300" },
  ];
}
