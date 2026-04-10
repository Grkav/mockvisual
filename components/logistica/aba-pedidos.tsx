"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Download, CameraOff, Power, ClipboardCheck, AlertTriangle } from "lucide-react";
import type { Pedido, StatusPedido, Comprovante, Veiculo } from "@/lib/mock-data";
import { VEICULOS, isPedidoParcialmenteEmbarcado } from "@/lib/mock-data";
import {
  SearchSelect, ElipsisMenu, ColFilterTh, TotalRow, IconeComprovante, ActionDropdownButton,
  StatusBadge, fmt, useSortable, useColFilters, calcularResultado,
  ValidacaoBadge, ResultadoBadge,
} from "@/components/logistica/layout-components";
import { ModalComprovante } from "@/components/logistica/modal-comprovante";
import { ModalMapaVeiculo } from "@/components/logistica/aba-veiculos";

// â”€â”€â”€ Abas internas do pedido (reutilizÃ¡vel) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AbasPedido({ pedido, filtroStatus }: { pedido: Pedido; filtroStatus?: StatusPedido[] }) {
  const [aba, setAba] = useState<"volumes" | "itens" | "comprovantes" | "ressalvas">("volumes");
  const [modalComp, setModalComp] = useState<{ comprovantes: Comprovante[]; indice: number } | null>(null);
  const comprovanteRessalva = (r: Pedido["ressalvas"][number]): Comprovante[] => [
    {
      id: `RES-COMP-${pedido.id}-${r.id}`,
      tipo: "Foto Ressalva",
      arquivo: r.arquivoFoto ?? `foto_ressalva_${pedido.nPedido}_${r.id}.jpg`,
      dataHora: r.dataHora,
      usuario: r.usuario,
    },
  ];

  return (
    <div className="mt-2 border border-indigo-200 rounded-md bg-white">
      {/* Modal de comprovante */}
      {modalComp && (
        <ModalComprovante
          comprovantes={modalComp.comprovantes}
          indiceInicial={modalComp.indice}
          pedidoNum={pedido.nPedido}
          onClose={() => setModalComp(null)}
        />
      )}
      <div className="flex border-b border-indigo-200 bg-indigo-50">
        {(["volumes", "itens", "comprovantes", "ressalvas"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-1.5 text-[11px] font-medium capitalize transition-colors border-r border-indigo-200 last:border-r-0 ${
              aba === a ? "bg-white text-indigo-700 border-b border-b-white -mb-px" : "text-gray-600 hover:bg-indigo-100"
            }`}
          >
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>

      {aba === "volumes" && (
        <table className="w-full text-[11px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">#</th>
              {["Tarefa/Retirada", "Nº Volume", "Hora Embarque", "Hora Desembarque", "Hora Entrega", "Rota"].map((h) => (
                <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedido.volumes
              .filter((v) => {
                // Se filtroStatus Ã© "Parcialmente Embarcado", mostrar apenas nÃ£o embarcados
                if (filtroStatus?.includes("Parcialmente Embarcado")) {
                  return !v.embarcado;
                }
                // SenÃ£o, mostrar todos
                return true;
              })
              .map((v, index) => (
                <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-500">{index + 1}</td>
                  <td className="px-3 py-1.5">{v.tarefaRetirada}</td>
                  <td className="px-3 py-1.5 font-mono text-[10px]">{v.nVolume}</td>
                  <td className="px-3 py-1.5">{v.horaEmbarque}</td>
                  <td className="px-3 py-1.5">{v.horaDesembarque}</td>
                  <td className="px-3 py-1.5">{v.horaEntrega}</td>
                  <td className="px-3 py-1.5">{v.rota}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {aba === "itens" && (
        <table className="w-full text-[11px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">#</th>
              {["ID", "ID Externo", "Produto", "Lote", "Validade", "Qtd Sol.", "Qtd. Devolvida", "Qtd Entregue", "Qtd Ressalva", "Vlr Unit.", "Vlr Total"].map((h) => (
                <th key={h} className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((item, index) => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-1.5 text-gray-500">{index + 1}</td>
                <td className="px-2 py-1.5 font-mono text-[10px]">{item.id}</td>
                <td className="px-2 py-1.5 text-[10px]">{item.idExterno}</td>
                <td className="px-2 py-1.5">{item.nomeProduto}</td>
                <td className="px-2 py-1.5">{item.lote}</td>
                <td className="px-2 py-1.5">{item.validade}</td>
                <td className="px-2 py-1.5 ">{item.qtdSolicitada}</td>
                <td className="px-2 py-1.5 ">{item.qtdEmbarcada}</td>
                <td className="px-2 py-1.5 ">{item.qtdEntregue}</td>
                <td className="px-2 py-1.5 ">
                  {item.qtdRessalva > 0 ? <span className="text-red-600 font-medium">{item.qtdRessalva}</span> : item.qtdRessalva}
                </td>
                <td className="px-2 py-1.5 ">{fmt(item.valorUnitario, "moeda")}</td>
                <td className="px-2 py-1.5 text-left font-medium">{fmt(item.valorTotal, "moeda")}</td>
              </tr>
            ))}
            <TotalRow>
              <td className="px-2 py-1.5 text-[10px] text-gray-500 uppercase" colSpan={6}>Total</td>
              <td className="px-2 py-1.5 text-left text-[11px]">{pedido.itens.reduce((s, i) => s + i.qtdSolicitada, 0)}</td>
              <td className="px-2 py-1.5 text-left text-[11px]">{pedido.itens.reduce((s, i) => s + i.qtdEmbarcada, 0)}</td>
              <td className="px-2 py-1.5 text-left text-[11px]">{pedido.itens.reduce((s, i) => s + i.qtdEntregue, 0)}</td>
              <td className="px-2 py-1.5 text-left text-[11px]">{pedido.itens.reduce((s, i) => s + i.qtdRessalva, 0)}</td>
              <td />
              <td className="px-2 py-1.5 text-left text-[11px]">{fmt(pedido.itens.reduce((s, i) => s + i.valorTotal, 0), "moeda")}</td>
            </TotalRow>
          </tbody>
        </table>
      )}

      {aba === "comprovantes" && (
        <table className="w-full text-[11px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">#</th>
              {["Tipo", "Arquivo", "Data/Hora", "Usuário", "Ação"].map((h) => (
                <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedido.comprovantes.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400 text-xs">Nenhum comprovante</td></tr>
            ) : pedido.comprovantes.map((c, idx) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-500">{idx + 1}</td>
                <td className="px-3 py-1.5">{c.tipo}</td>
                <td
                  className="px-3 py-1.5 text-blue-600 underline cursor-pointer"
                  onClick={() => setModalComp({ comprovantes: pedido.comprovantes, indice: idx })}
                >
                  {c.arquivo}
                </td>
                <td className="px-3 py-1.5">{c.dataHora}</td>
                <td className="px-3 py-1.5">{c.usuario}</td>
                <td className="px-3 py-1.5">
                  <button
                    className="text-blue-600 hover:underline text-[10px] font-medium"
                    onClick={() => setModalComp({ comprovantes: pedido.comprovantes, indice: idx })}
                  >
                    Visualizar / Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {aba === "ressalvas" && (
        <table className="w-full text-[11px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">#</th>
              {["Tipo", "Motivo", "Criação", "Usuário", "Status", "FOTO"].map((h) => (
                <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedido.ressalvas.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-400 text-xs">Nenhuma ressalva</td></tr>
            ) : pedido.ressalvas.map((r, index) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-500">{index + 1}</td>
                <td className="px-3 py-1.5">{r.tipo}</td>
                <td className="px-3 py-1.5">{r.descricao}</td>
                <td className="px-3 py-1.5">{r.dataHora}</td>
                <td className="px-3 py-1.5">{r.usuario}</td>
                <td className="px-3 py-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700">{r.status}</span>
                </td>
                <td className="px-3 py-1.5">
                  {r.temFoto ? (
                    <button
                      className="text-blue-600 hover:underline text-[10px] font-medium"
                      onClick={() => setModalComp({ comprovantes: comprovanteRessalva(r), indice: 0 })}
                    >
                      Visualizar
                    </button>
                  ) : (
                    <span className="text-gray-400 text-[10px]">Sem foto</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// â”€â”€â”€ Linha de Pedido â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LinhaPedido({
  pedido,
  filtroStatus,
  index,
  onAbrirMapa,
}: {
  pedido: Pedido;
  filtroStatus?: StatusPedido[];
  index: number;
  onAbrirMapa: (pedido: Pedido) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [modalCompIcone, setModalCompIcone] = useState<{ comprovantes: Comprovante[]; indice: number } | null>(null);
  const ressalvaSemFoto = Boolean(
    pedido.tipoRessalva &&
    (pedido.ressalvas.length === 0 || pedido.ressalvas.some((r) => !r.temFoto))
  );

  return (
    <>
      {modalCompIcone && (
        <ModalComprovante
          comprovantes={modalCompIcone.comprovantes}
          indiceInicial={modalCompIcone.indice}
          pedidoNum={pedido.nPedido}
          onClose={() => setModalCompIcone(null)}
        />
      )}
      <tr
        onClick={() => setExpandido(!expandido)}
        className={`border-t border-gray-100 cursor-pointer transition-colors ${expandido ? "bg-indigo-50/60" : "hover:bg-gray-50"}`}
      >
        <td className="pl-3 pr-1 py-2 w-7">
          <button className="text-gray-400 hover:text-indigo-600">
            {expandido ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </td>
        <td className="px-2 py-2 text-[11px] text-center text-gray-500">{index}</td>
        <td className="px-2 py-2 text-[11px]">{pedido.operacao}</td>
        <td className="px-2 py-2 text-[11px] text-blue-700 font-semibold">{pedido.nPedido}</td>
        <td className="px-2 py-2 text-[11px]">{pedido.nRemessa}</td>
        <td className="px-2 py-2 text-[11px]">{pedido.cliente}</td>
        <td className="px-2 py-2 text-[11px]">{pedido.nomeTarefa}</td>
        <td className="px-2 py-2 text-[11px]">{pedido.tipoServico}</td>
        <td className="px-2 py-2 text-[11px]">{pedido.dataAgendada}</td>
        <td className="px-2 py-2 text-[11px] text-center font-medium">{pedido.qtdVolumes}/{pedido.qtdVolumesTotal}</td>
        <td className="px-2 py-2 text-[11px] text-right">{fmt(pedido.peso, "peso")}</td>
        <td className="px-2 py-2 text-[11px] text-right">{fmt(pedido.cubagem, "cubagem")}</td>
        <td className="px-2 py-2 text-[11px] text-right font-medium">{fmt(pedido.valorTotal, "moeda")}</td>
        <td className="px-2 py-2"><StatusBadge status={pedido.status} /></td>
        <td className="px-2 py-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">{pedido.prioridade}</span>
        </td>
        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAbrirMapa(pedido)}
            className="text-blue-700 font-semibold text-[11px] hover:underline font-mono"
          >
            {pedido.placa}
          </button>
        </td>
        <td className="px-2 py-2 text-[11px]">{pedido.motorista}</td>
        <td className="px-2 py-2 text-[11px]">{pedido.ajudante}</td>
        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          {pedido.comComprovante ? (
            <button
              type="button"
              className="inline-flex"
              title="Abrir comprovante"
              onClick={() => {
                if (pedido.comprovantes.length === 0) return;
                setModalCompIcone({ comprovantes: pedido.comprovantes, indice: 0 });
              }}
            >
              <IconeComprovante tem={true} />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <IconeComprovante tem={false} />
              <span className="text-[10px]">-</span>
              <CameraOff size={12} />
            </span>
          )}
        </td>
        <td className="px-2 py-2">
          {pedido.tipoRessalva ? (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${pedido.tipoRessalva === "No Pedido" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
              {pedido.tipoRessalva}
              {ressalvaSemFoto && (
                <>
                  <span>-</span>
                  <CameraOff size={12} />
                </>
              )}
            </span>
          ) : <span className="text-gray-300 text-[10px]">-</span>}
        </td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={pedido.validacao.entregaRoterizada} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={pedido.validacao.volumeEmbarcadoVal} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={pedido.validacao.registroEntrega} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={pedido.validacao.chegadaSaidaInformada} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={pedido.validacao.rotaFinalizada} /></td>
        <td className="px-2 py-2 text-center">
          <div className="flex items-center gap-1 justify-center">
            <ResultadoBadge validacao={pedido.validacao} />
          </div>
        </td>
        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <ElipsisMenu items={[
            { label: "Inativar Pedido", icon: <Power size={12} />, action: () => alert(`Inativando pedido ${pedido.nPedido}`), danger: true },
            { label: "Registrar entrega", icon: <ClipboardCheck size={12} />, action: () => alert(`Registrando entrega do pedido ${pedido.nPedido}`) },
            { label: "Registrar Ressalva", icon: <AlertTriangle size={12} />, action: () => alert(`Registrando ressalva do pedido ${pedido.nPedido}`) },
            { label: "Exportar Volumes desse Pedido", icon: <Download size={12} />, action: () => alert(`Exportando volumes ${pedido.nPedido}`) },
            { label: "Exportar Itens desse Pedido", icon: <Download size={12} />, action: () => alert(`Exportando itens ${pedido.nPedido}`) },
            { label: "Exportar Comprovantes desse Pedido", icon: <Download size={12} />, action: () => alert(`Exportando comprovantes ${pedido.nPedido}`) },
            { label: "Exportar Ressalvas desse Pedido", icon: <Download size={12} />, action: () => alert(`Exportando ressalvas ${pedido.nPedido}`) },
          ]} />
        </td>
      </tr>
      {expandido && (
        <tr>
          <td colSpan={27} className="px-5 pb-3 bg-indigo-50/30">
            <AbasPedido pedido={pedido} filtroStatus={filtroStatus} />
          </td>
        </tr>
      )}
    </>
  );
}

// â”€â”€â”€ Aba Pedidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AbaPedidosProps {
  pedidos: Pedido[];
  filtroStatus: StatusPedido[];
  filtroPrioridade: string;
  filtroPedidoGlobal: string;
  filtroRemessaGlobal: string;
  filtroOperacaoGlobal: string;
}

export function AbaPedidos({ pedidos, filtroStatus, filtroPrioridade, filtroPedidoGlobal, filtroRemessaGlobal, filtroOperacaoGlobal }: AbaPedidosProps) {
  const [filtroPedido, setFiltroPedido] = useState("");
  const [filtroRemessa, setFiltroRemessa] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroStatusLocal, setFiltroStatusLocal] = useState("");
  const [filtroPriorLocal, setFiltroPriorLocal] = useState("");
  const [filtroOperacaoLocal, setFiltroOperacaoLocal] = useState("");
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [filtroRessalva, setFiltroRessalva] = useState("");
  const [filtroComprovante, setFiltroComprovante] = useState("");
  const [pedidoMapa, setPedidoMapa] = useState<{ veiculo: Veiculo; pedido: Pedido } | null>(null);

  const pedidosComValidacao = pedidos.map((p) => ({
    ...p,
    valRoterizada: p.validacao.entregaRoterizada ? "Sim" : "Não",
    valVolEmb: p.validacao.volumeEmbarcadoVal ? "Sim" : "Não",
    valRegEntrega: p.validacao.registroEntrega ? "Sim" : "Não",
    valChegSaida: p.validacao.chegadaSaidaInformada ? "Sim" : "Não",
    valRotaFinal: p.validacao.rotaFinalizada ? "Sim" : "Não",
    valResultado: calcularResultado(p.validacao),
  }));

  const { sorted, sortConfig, handleSort } = useSortable(pedidosComValidacao, "nPedido");
  const { colFilters, setFilter, clearAllFilters, hasActiveFilters, applyColFilters, getUniqueValues } = useColFilters();

  const filtradosBase = sorted.filter((p) => {
    if (filtroStatus.length > 0) {
      const combinaAlgumStatus = filtroStatus.some((status) => {
        if (status === "Com Ressalvas") return p.tipoRessalva !== null || p.ressalvas.length > 0;
        if (status === "Parcialmente Embarcado") {
          return isPedidoParcialmenteEmbarcado(p);
        }
        return p.status === status;
      });
      if (!combinaAlgumStatus) return false;
    }
    if (filtroPrioridade && p.prioridade !== filtroPrioridade) return false;
    if (filtroPedidoGlobal && !p.nPedido.toLowerCase().includes(filtroPedidoGlobal.toLowerCase())) return false;
    if (filtroRemessaGlobal && !p.nRemessa.toLowerCase().includes(filtroRemessaGlobal.toLowerCase())) return false;
    if (filtroOperacaoGlobal && p.operacao !== filtroOperacaoGlobal) return false;
    if (filtroPedido && !p.nPedido.toLowerCase().includes(filtroPedido.toLowerCase())) return false;
    if (filtroRemessa && !p.nRemessa.toLowerCase().includes(filtroRemessa.toLowerCase())) return false;
    if (filtroCliente && p.cliente !== filtroCliente) return false;
    if (filtroStatusLocal && p.status !== filtroStatusLocal) return false;
    if (filtroPriorLocal && p.prioridade !== filtroPriorLocal) return false;
    if (filtroOperacaoLocal && p.operacao !== filtroOperacaoLocal) return false;
    if (filtroVeiculo && p.placa !== filtroVeiculo) return false;
    if (filtroRessalva && p.tipoRessalva !== filtroRessalva) return false;
    if (filtroComprovante === "Sim" && !p.comComprovante) return false;
    if (filtroComprovante === "Não" && p.comComprovante) return false;
    return true;
  });
  const filtrados = applyColFilters(filtradosBase as Record<string, unknown>[]) as Pedido[];

  const uniq = (arr: string[]) => [...new Set(arr)].filter(Boolean).sort();
  const statusOpts = uniq(pedidos.map((p) => p.status));

  function abrirMapaPedido(pedido: Pedido) {
    const veiculo = VEICULOS.find((v) => v.placa === pedido.placa);
    if (!veiculo) return;
    setPedidoMapa({ veiculo, pedido });
  }

  return (
    <div className="flex flex-col h-full">
      {pedidoMapa && (
        <ModalMapaVeiculo
          veiculo={pedidoMapa.veiculo}
          pedidoFoco={pedidoMapa.pedido}
          onClose={() => setPedidoMapa(null)}
        />
      )}
      {/* Filtros */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-wrap">
        <input
          value={filtroPedido}
          onChange={(e) => setFiltroPedido(e.target.value)}
          placeholder="Nº Pedido"
          className="h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-28"
        />
        <input
          value={filtroRemessa}
          onChange={(e) => setFiltroRemessa(e.target.value)}
          placeholder="Remessa"
          className="h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-24"
        />
        {/* 
        <SearchSelect placeholder="Todos Clientes" options={uniq(pedidos.map((p) => p.cliente))} value={filtroCliente} onChange={setFiltroCliente} />
        <SearchSelect placeholder="Todos Status" options={statusOpts} value={filtroStatusLocal} onChange={setFiltroStatusLocal} />
        <SearchSelect placeholder="Todas Prior." options={["A","B","C","D","E","F"]} value={filtroPriorLocal} onChange={setFiltroPriorLocal} />
        <SearchSelect placeholder="Todos Veículos" options={uniq(pedidos.map((p) => p.placa))} value={filtroVeiculo} onChange={setFiltroVeiculo} />
        <SearchSelect placeholder="Tipo Ressalva" options={["No Item","No Pedido"]} value={filtroRessalva} onChange={setFiltroRessalva} />
        <SearchSelect placeholder="Comprovante" options={["Sim","Não"]} value={filtroComprovante} onChange={setFiltroComprovante} />
        */}
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 h-7 px-2.5 text-[11px] bg-indigo-50 text-indigo-700 rounded border border-indigo-300 hover:bg-indigo-100"
          >
            Limpar filtros de coluna ×
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center h-7 px-2.5 text-[11px] bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
            {filtrados.length} pedido(s)
          </span>
          <ActionDropdownButton
            label="Exportar"
            icon={<Download size={12} />}
            items={[
              { label: "Pedidos", icon: <Download size={12} />, action: () => alert("Exportando pedidos...") },
              { label: "Volumes", icon: <Download size={12} />, action: () => alert("Exportando volumes...") },
              { label: "Itens", icon: <Download size={12} />, action: () => alert("Exportando itens...") },
            ]}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="w-7" />
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-600 uppercase">#</th>
              <ColFilterTh label="Operação" sortKey="operacao" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "operacao")} selected={colFilters["operacao"] ?? new Set()} onFilterChange={(s) => setFilter("operacao", s)} />
              <ColFilterTh label="Nº Pedido" sortKey="nPedido" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "nPedido")} selected={colFilters["nPedido"] ?? new Set()} onFilterChange={(s) => setFilter("nPedido", s)} />
              <ColFilterTh label="Remessa" sortKey="nRemessa" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "nRemessa")} selected={colFilters["nRemessa"] ?? new Set()} onFilterChange={(s) => setFilter("nRemessa", s)} />
              <ColFilterTh label="Cliente" sortKey="cliente" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "cliente")} selected={colFilters["cliente"] ?? new Set()} onFilterChange={(s) => setFilter("cliente", s)} />
              <ColFilterTh label="Tarefa/Retirada" sortKey="nomeTarefa" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "nomeTarefa")} selected={colFilters["nomeTarefa"] ?? new Set()} onFilterChange={(s) => setFilter("nomeTarefa", s)} />
              <ColFilterTh label="Tipo Serv." sortKey="tipoServico" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "tipoServico")} selected={colFilters["tipoServico"] ?? new Set()} onFilterChange={(s) => setFilter("tipoServico", s)} />
              <ColFilterTh label="Dt. Agend." sortKey="dataAgendada" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "dataAgendada")} selected={colFilters["dataAgendada"] ?? new Set()} onFilterChange={(s) => setFilter("dataAgendada", s)} />
              <ColFilterTh label="Vol. Emb." sortKey="volumeEmbarcado" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "volumeEmbarcado")} selected={colFilters["volumeEmbarcado"] ?? new Set()} onFilterChange={(s) => setFilter("volumeEmbarcado", s)} />
              <ColFilterTh label="Peso" sortKey="peso" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "peso")} selected={colFilters["peso"] ?? new Set()} onFilterChange={(s) => setFilter("peso", s)} className="" />
              <ColFilterTh label="Cubagem" sortKey="cubagem" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "cubagem")} selected={colFilters["cubagem"] ?? new Set()} onFilterChange={(s) => setFilter("cubagem", s)} className="" />
              <ColFilterTh label="Valor Total" sortKey="valorTotal" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "valorTotal")} selected={colFilters["valorTotal"] ?? new Set()} onFilterChange={(s) => setFilter("valorTotal", s)} className="" />
              <ColFilterTh label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "status")} selected={colFilters["status"] ?? new Set()} onFilterChange={(s) => setFilter("status", s)} />
              <ColFilterTh label="Prior." sortKey="prioridade" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "prioridade")} selected={colFilters["prioridade"] ?? new Set()} onFilterChange={(s) => setFilter("prioridade", s)} />
              <ColFilterTh label="Placa" sortKey="placa" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "placa")} selected={colFilters["placa"] ?? new Set()} onFilterChange={(s) => setFilter("placa", s)} />
              <ColFilterTh label="Motorista" sortKey="motorista" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "motorista")} selected={colFilters["motorista"] ?? new Set()} onFilterChange={(s) => setFilter("motorista", s)} />
              <ColFilterTh label="Ajudante" sortKey="ajudante" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "ajudante")} selected={colFilters["ajudante"] ?? new Set()} onFilterChange={(s) => setFilter("ajudante", s)} />
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-600">Comprovante</th>
              <ColFilterTh label="Ressalva" sortKey="tipoRessalva" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "tipoRessalva")} selected={colFilters["tipoRessalva"] ?? new Set()} onFilterChange={(s) => setFilter("tipoRessalva", s)} />
              <ColFilterTh label="Roterizada?" sortKey="valRoterizada" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Motorista" values={getUniqueValues(sorted, "valRoterizada")} selected={colFilters["valRoterizada"] ?? new Set()} onFilterChange={(s) => setFilter("valRoterizada", s)} />
              <ColFilterTh label="Vol. Emb.?" sortKey="valVolEmb" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Ajudante" values={getUniqueValues(sorted, "valVolEmb")} selected={colFilters["valVolEmb"] ?? new Set()} onFilterChange={(s) => setFilter("valVolEmb", s)} />
              <ColFilterTh label="Reg. Entrega?" sortKey="valRegEntrega" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Ajudante" values={getUniqueValues(sorted, "valRegEntrega")} selected={colFilters["valRegEntrega"] ?? new Set()} onFilterChange={(s) => setFilter("valRegEntrega", s)} />
              <ColFilterTh label="Cheg./Saída?" sortKey="valChegSaida" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Motorista" values={getUniqueValues(sorted, "valChegSaida")} selected={colFilters["valChegSaida"] ?? new Set()} onFilterChange={(s) => setFilter("valChegSaida", s)} />
              <ColFilterTh label="Rota Final.?" sortKey="valRotaFinal" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Motorista" values={getUniqueValues(sorted, "valRotaFinal")} selected={colFilters["valRotaFinal"] ?? new Set()} onFilterChange={(s) => setFilter("valRotaFinal", s)} />
              <ColFilterTh label="Andamento" sortKey="valResultado" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "valResultado")} selected={colFilters["valResultado"] ?? new Set()} onFilterChange={(s) => setFilter("valResultado", s)} />
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-600 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filtrados.map((p, index) => (
              <LinhaPedido
                key={p.id}
                pedido={p}
                filtroStatus={filtroStatus}
                index={index + 1}
                onAbrirMapa={abrirMapaPedido}
              />
            ))}
            <TotalRow>
              <td />
              <td className="px-2 py-1.5 text-[11px] text-center text-gray-500">#</td>
              <td className="px-2 py-1.5 text-[11px] font-bold text-gray-600">{filtrados.length} de {pedidos.length} pedidos</td>
              <td className="px-2 py-1.5" colSpan={6} />
              <td className="px-2 py-1.5 text-[11px] text-center font-bold">
                {filtrados.reduce((s, p) => s + p.qtdVolumes, 0)}/{filtrados.reduce((s, p) => s + p.qtdVolumesTotal, 0)}
              </td>
              <td className="px-2 py-1.5 text-[11px] text-right font-bold">{fmt(filtrados.reduce((s, p) => s + p.peso, 0), "peso")}</td>
              <td className="px-2 py-1.5 text-[11px] text-right font-bold">{fmt(filtrados.reduce((s, p) => s + p.cubagem, 0), "cubagem")}</td>
              <td className="px-2 py-1.5 text-[11px] text-right font-bold">{fmt(filtrados.reduce((s, p) => s + p.valorTotal, 0), "moeda")}</td>
              <td colSpan={15} />
            </TotalRow>
          </tbody>
        </table>
      </div>
    </div>
  );
}
