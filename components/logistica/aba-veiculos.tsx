"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, ChevronDown, Download, X, CameraOff, Truck, Package, Warehouse, AlertTriangle, RefreshCw } from "lucide-react";
import { ModalComprovante } from "@/components/logistica/modal-comprovante";
import type { Veiculo, Pedido, StatusPedido, Tarefa } from "@/lib/mock-data";
import { TAREFAS, isPedidoParcialmenteEmbarcado } from "@/lib/mock-data";
import {
  SearchSelect, ElipsisMenu, SortableTh, ColFilterTh, TotalRow, IconeComprovante, ActionDropdownButton,
  StatusBadge, fmt, useSortable, useColFilters, calcularResultado,
  ValidacaoBadge, ResultadoBadge, NaoProgramadoBadge, ThValidacao,
} from "@/components/logistica/layout-components";

// â”€â”€â”€ Abas internas do pedido â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AbasPedido({ pedido, filtroStatus }: { pedido: Pedido; filtroStatus?: StatusPedido[] }) {
  const [aba, setAba] = useState<"volumes" | "itens" | "comprovantes" | "ressalvas">("volumes");
  const [modalComp, setModalComp] = useState<{ comprovantes: Pedido["comprovantes"]; indice: number } | null>(null);
  const comprovanteRessalva = (r: Pedido["ressalvas"][number]): Pedido["comprovantes"] => [
    {
      id: `RES-COMP-${pedido.id}-${r.id}`,
      tipo: "Foto Ressalva",
      arquivo: r.arquivoFoto ?? `foto_ressalva_${pedido.nPedido}_${r.id}.jpg`,
      dataHora: r.dataHora,
      usuario: r.usuario,
    },
  ];

  return (
    <div className="mt-2 border border-blue-200 rounded-md bg-white">
      <div className="flex border-b border-blue-200 bg-blue-50">
        {(["volumes", "itens", "comprovantes", "ressalvas"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-1.5 text-[11px] font-medium capitalize transition-colors border-r border-blue-200 last:border-r-0 ${
              aba === a ? "bg-white text-blue-700 border-b border-b-white -mb-px" : "text-gray-600 hover:bg-blue-100"
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
                  {item.qtdRessalva > 0 ? (
                    <span className="text-red-600 font-medium">{item.qtdRessalva}</span>
                  ) : item.qtdRessalva}
                </td>
                <td className="px-2 py-1.5 ">{fmt(item.valorUnitario, "moeda")}</td>
                <td className="px-2 py-1.5  font-medium">{fmt(item.valorTotal, "moeda")}</td>
              </tr>
            ))}
            <TotalRow>
              <td className="px-2 py-1.5 text-[10px] text-gray-500 uppercase" colSpan={6}>Total</td>
              <td className="px-2 py-1.5  text-[11px]">{pedido.itens.reduce((s, i) => s + i.qtdSolicitada, 0)}</td>
              <td className="px-2 py-1.5  text-[11px]">{pedido.itens.reduce((s, i) => s + i.qtdEmbarcada, 0)}</td>
              <td className="px-2 py-1.5  text-[11px]">{pedido.itens.reduce((s, i) => s + i.qtdEntregue, 0)}</td>
              <td className="px-2 py-1.5  text-[11px]">{pedido.itens.reduce((s, i) => s + i.qtdRessalva, 0)}</td>
              <td />
              <td className="px-2 py-1.5  text-[11px]">{fmt(pedido.itens.reduce((s, i) => s + i.valorTotal, 0), "moeda")}</td>
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
              <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400 text-xs">Nenhum comprovante registrado</td></tr>
            ) : pedido.comprovantes.map((c, idx) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-500">{idx + 1}</td>
                <td className="px-3 py-1.5">{c.tipo}</td>
                <td className="px-3 py-1.5 text-blue-600 underline cursor-pointer">{c.arquivo}</td>
                <td className="px-3 py-1.5">{c.dataHora}</td>
                <td className="px-3 py-1.5">{c.usuario}</td>
                <td className="px-3 py-1.5">
                  <button
                    className="text-blue-600 hover:underline text-[10px]"
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
              {["Tipo", "Motivo", "Criação", "Usuário", "Status", "TRATAMENTO", "FOTO"].map((h) => (
                <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedido.ressalvas.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-gray-400 text-xs">Nenhuma ressalva registrada</td></tr>
            ) : pedido.ressalvas.map((r, index) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-500">{index + 1}</td>
                <td className="px-3 py-1.5">
                  {pedido.tipoRessalva ? (
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        pedido.tipoRessalva === "No Pedido" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {pedido.tipoRessalva}
                    </span>
                  ) : (
                    <span className="text-gray-300">--</span>
                  )}
                </td>
                <td className="px-3 py-1.5">{r.descricao}</td>
                <td className="px-3 py-1.5">{r.dataHora}</td>
                <td className="px-3 py-1.5">{r.usuario}</td>
                <td className="px-3 py-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700">{r.status}</span>
                </td>
                <td className="px-3 py-1.5">{r.dataHoraTratamento ?? "--"}</td>
                <td className="px-3 py-1.5">
                  {r.temFoto ? (
                    <button
                      className="text-blue-600 hover:underline text-[10px]"
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
      {modalComp && (
        <ModalComprovante
          comprovantes={modalComp.comprovantes}
          indiceInicial={modalComp.indice}
          pedidoNum={pedido.nPedido}
          onClose={() => setModalComp(null)}
        />
      )}
    </div>
  );
}

// â”€â”€â”€ Linha de Pedido expandida dentro do Veículo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LinhaPedidoVeiculo({
  pedido,
  filtroStatus,
  index,
  compact = false,
}: {
  pedido: Pedido;
  filtroStatus?: StatusPedido[];
  index: number;
  compact?: boolean;
}) {
  const [expandido, setExpandido] = useState(false);
  const ressalvaSemFoto = Boolean(
    pedido.tipoRessalva &&
    (pedido.ressalvas.length === 0 || pedido.ressalvas.some((r) => !r.temFoto))
  );
  return (
    <>
      <tr
        onClick={() => setExpandido(!expandido)}
        className={`border-t border-gray-100 cursor-pointer transition-colors ${expandido ? "bg-blue-50" : "hover:bg-gray-50"}`}
      >
        <td className="px-3 py-1.5 w-7">
          <button className="text-gray-400 hover:text-blue-600">
            {expandido ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </td>
        <td className="px-2 py-1.5 text-[11px] text-center text-gray-500">{index}</td>
        <td className="px-2 py-1.5 text-[11px]">{pedido.operacao}</td>
        <td className="px-2 py-1.5 text-[11px] text-blue-700 font-medium">{pedido.nPedido}</td>
        <td className="px-2 py-1.5 text-[11px]">{pedido.nRemessa}</td>
        <td className="px-2 py-1.5 text-[11px]">{pedido.cliente}</td>
        <td className="px-2 py-1.5 text-[11px]">{pedido.rota}</td>
        <td className="px-2 py-1.5 text-[11px]">{pedido.tipoServico}</td>
        <td className="px-2 py-1.5 text-[11px]">{pedido.dataAgendada}</td>
        <td className="px-2 py-1.5 text-[11px] text-center">{`${pedido.qtdVolumes}/${pedido.qtdVolumesTotal}`}</td>
        <td className="px-2 py-1.5 text-[11px] ">{fmt(pedido.peso, "peso")}</td>
        <td className="px-2 py-1.5 text-[11px] ">{fmt(pedido.cubagem, "cubagem")}</td>
        <td className="px-2 py-1.5 text-[11px]  font-medium">{fmt(pedido.valorTotal, "moeda")}</td>
        <td className="px-2 py-1.5">
          <StatusBadge status={pedido.status} />
        </td>
        <td className="px-2 py-1.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">{pedido.prioridade}</span>
        </td>
        <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
          {pedido.comComprovante ? (
            <IconeComprovante tem={true} />
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <IconeComprovante tem={false} />
              <span className="text-[10px]">-</span>
              <CameraOff size={12} />
            </span>
          )}
        </td>
        <td className="px-2 py-1.5">
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
        {!compact && (
          <>
            <td className="px-2 py-1.5 text-center"><ValidacaoBadge valor={pedido.validacao.entregaRoterizada} /></td>
            <td className="px-2 py-1.5 text-center"><ValidacaoBadge valor={pedido.validacao.volumeEmbarcadoVal} /></td>
            <td className="px-2 py-1.5 text-center"><ValidacaoBadge valor={pedido.validacao.registroEntrega} /></td>
            <td className="px-2 py-1.5 text-center"><ValidacaoBadge valor={pedido.validacao.chegadaSaidaInformada} /></td>
            <td className="px-2 py-1.5 text-center"><ValidacaoBadge valor={pedido.validacao.rotaFinalizada} /></td>
            <td className="px-2 py-1.5 text-center">
              <div className="flex items-center gap-1 justify-center">
                {pedido.validacao.pedidoNaoProgramado && <NaoProgramadoBadge />}
                <ResultadoBadge validacao={pedido.validacao} />
              </div>
            </td>
            <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
              <ElipsisMenu items={[
                { label: "Exportar Volumes desse Pedido", icon: <Download size={12} />, action: () => alert(`Exportando volumes do ${pedido.nPedido}`) },
                { label: "Exportar Itens desse Pedido", icon: <Download size={12} />, action: () => alert(`Exportando itens do ${pedido.nPedido}`) },
              ]} />
            </td>
          </>
        )}
      </tr>
      {expandido && (
        <tr>
          <td colSpan={compact ? 16 : 24} className="px-4 pb-3 bg-blue-50/50">
            <AbasPedido pedido={pedido} filtroStatus={filtroStatus} />
          </td>
        </tr>
      )}
    </>
  );
}

function LinhaPedidoModalMapa({
  pedido,
  index,
  nested = false,
}: {
  pedido: Pedido;
  index: number;
  nested?: boolean;
}) {
  const [expandido, setExpandido] = useState(false);
  const ressalvaSemFoto = Boolean(
    pedido.tipoRessalva &&
    (pedido.ressalvas.length === 0 || pedido.ressalvas.some((r) => !r.temFoto))
  );

  return (
    <>
      <tr
        onClick={() => setExpandido(!expandido)}
        className={`border-t border-gray-100 cursor-pointer transition-colors ${expandido ? "bg-blue-50" : "hover:bg-gray-50"}`}
      >
        <td className={`pr-1 py-2 w-7 ${nested ? "pl-6" : "pl-3"}`}>
          <button className="text-gray-400 hover:text-blue-600">
            {expandido ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </td>
        <td className="px-3 py-2 text-gray-500">{index}</td>
        <td className="px-3 py-2">
          <div className={`${nested ? "pl-1" : ""}`}>
            <span className="text-blue-700 font-semibold">{pedido.nPedido}</span>
          </div>
        </td>
        <td className="px-3 py-2 text-gray-500">{pedido.nRemessa}</td>
        <td className="px-3 py-2"><StatusBadge status={pedido.status} /></td>
        <td className="px-3 py-2 text-center">{`${pedido.qtdVolumes}/${pedido.qtdVolumesTotal}`}</td>
        <td className="px-3 py-2">{fmt(pedido.peso, "peso")}</td>
        <td className="px-3 py-2">{fmt(pedido.cubagem, "cubagem")}</td>
        <td className="px-3 py-2 font-medium">{fmt(pedido.valorTotal, "moeda")}</td>
        <td className="px-3 py-2">
          {pedido.tipoRessalva ? (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${pedido.tipoRessalva === "No Pedido" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
              {pedido.tipoRessalva}
              {ressalvaSemFoto && <CameraOff size={11} />}
            </span>
          ) : <span className="text-gray-300">--</span>}
        </td>
      </tr>
      {expandido && (
        <tr>
          <td colSpan={10} className={`${nested ? "px-8 pb-3 bg-blue-50/30" : "px-4 pb-3 bg-blue-50/30"}`}>
            <AbasPedido pedido={pedido} />
          </td>
        </tr>
      )}
    </>
  );
}

function LinhaClienteModalMapa({
  cliente,
  pedidos,
  index,
}: {
  cliente: string;
  pedidos: Pedido[];
  index: number;
}) {
  const [expandido, setExpandido] = useState(false);
  const totaisCliente = useMemo(
    () =>
      pedidos.reduce(
        (acc, pedido) => {
          acc.volumes += pedido.qtdVolumes;
          acc.volumesTotal += pedido.qtdVolumesTotal;
          acc.peso += pedido.peso;
          acc.cubagem += pedido.cubagem;
          acc.valor += pedido.valorTotal;
          acc.ressalvas += pedido.tipoRessalva ? 1 : 0;
          return acc;
        },
        { volumes: 0, volumesTotal: 0, peso: 0, cubagem: 0, valor: 0, ressalvas: 0 }
      ),
    [pedidos]
  );

  return (
    <>
      <tr
        onClick={() => setExpandido(!expandido)}
        className={`border-t border-gray-100 cursor-pointer transition-colors ${expandido ? "bg-blue-50/60" : "hover:bg-gray-50"}`}
      >
        <td className="pl-3 pr-1 py-2 w-7">
          <button className="text-gray-400 hover:text-blue-600">
            {expandido ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </td>
        <td className="px-3 py-2 text-gray-500 font-medium">{index}</td>
        <td className="px-3 py-2 font-semibold text-blue-700">{cliente}</td>
        <td className="px-3 py-2 text-gray-600">{pedidos.length} pedido(s)</td>
        <td className="px-3 py-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
            Cliente
          </span>
        </td>
        <td className="px-3 py-2 text-center font-medium">{`${totaisCliente.volumes}/${totaisCliente.volumesTotal}`}</td>
        <td className="px-3 py-2 font-medium">{fmt(totaisCliente.peso, "peso")}</td>
        <td className="px-3 py-2 font-medium">{fmt(totaisCliente.cubagem, "cubagem")}</td>
        <td className="px-3 py-2 font-semibold">{fmt(totaisCliente.valor, "moeda")}</td>
        <td className="px-3 py-2">
          {totaisCliente.ressalvas > 0 ? (
            <span className="inline-flex items-center rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
              {totaisCliente.ressalvas} com ressalva
            </span>
          ) : (
            <span className="text-gray-300">--</span>
          )}
        </td>
      </tr>
      {expandido &&
        pedidos.map((pedido, pedidoIndex) => (
          <LinhaPedidoModalMapa key={pedido.id} pedido={pedido} index={pedidoIndex + 1} nested />
        ))}
    </>
  );
}

// â”€â”€â”€ Modal Mapa Veículo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type TipoMarkerMapa = "origem" | "veiculo" | "destino";

interface TrackingMarkerMock {
  latitude: string;
  longitude: string;
  tipo: TipoMarkerMapa;
  placa: string | null;
  cor: string;
  endereco: string | null;
  contato: string | null;
  entityID: string;
  opId: string | null;
  entregue: string | null;
  naoEntregue: string | null;
  comRessalva: string | null;
  addressId: string | null;
  nome: string;
  descricao: string;
  pedidosCliente?: string[];
}

interface LocalizacaoFicticia {
  lat: number;
  lng: number;
  endereco: string;
  contato?: string;
}

interface TileInfo {
  key: string;
  x: number;
  y: number;
  src: string;
}

interface MarkerPixel extends TrackingMarkerMock {
  lat: number;
  lng: number;
  worldX: number;
  worldY: number;
}

const COR_OPERACAO_MOCK: Record<string, string> = {
  "SP-Capital": "#1E3C7D",
  "ABC-Guarulhos": "#005A9C",
  "RJ-Centro": "#0B7285",
  "MG-BH": "#5A3E85",
};

const GALPAO_POR_OPERACAO: Record<string, string> = {
  "SP-Capital": "Galpão SP",
  "ABC-Guarulhos": "Galpão Guarulhos",
  "RJ-Centro": "Galpão RJ",
  "MG-BH": "Galpão BH",
};

const LOCALIZACOES_FICTICIAS: Record<string, LocalizacaoFicticia> = {
  "Galpão SP": { lat: -23.5452, lng: -46.6295, endereco: "Rua do Galpão, 100 - São Paulo/SP" },
  "Galpão Guarulhos": { lat: -23.4549, lng: -46.5338, endereco: "Av. Cumbica, 1200 - Guarulhos/SP" },
  "Galpão RJ": { lat: -22.9064, lng: -43.1722, endereco: "Av. Brasil, 8900 - Rio de Janeiro/RJ" },
  "Galpão BH": { lat: -19.9198, lng: -43.9382, endereco: "Anel Rodoviário, 4500 - Belo Horizonte/MG" },
  "Supermercado Bom Preço": { lat: -23.5409, lng: -46.6065, endereco: "Av. Paulista, 1500 - São Paulo/SP", contato: "(11) 99999-1111" },
  "Distribuidora Alfa": { lat: -23.5578, lng: -46.5852, endereco: "Rua Vergueiro, 500 - São Paulo/SP", contato: "(11) 98888-2222" },
  "Padaria Pão Quente": { lat: -23.4516, lng: -46.5174, endereco: "Rua Dona Tecla, 90 - Guarulhos/SP", contato: "(11) 97777-3333" },
  "Restaurante Sabor & Arte": { lat: -23.4684, lng: -46.5068, endereco: "Av. Salgado Filho, 420 - Guarulhos/SP", contato: "(11) 96666-4444" },
  "Atacado Norte": { lat: -23.4843, lng: -46.5525, endereco: "Rua Nova Cumbica, 780 - Guarulhos/SP", contato: "(11) 95555-5555" },
  "Farmácia Saúde Total": { lat: -22.9154, lng: -43.1975, endereco: "Rua do Catete, 600 - Rio de Janeiro/RJ", contato: "(21) 94444-6666" },
  "Loja Mega Eletro": { lat: -22.9253, lng: -43.1758, endereco: "Av. Rio Branco, 350 - Rio de Janeiro/RJ", contato: "(21) 93333-7777" },
  "Mini Mercado Estrela": { lat: -23.5178, lng: -46.6031, endereco: "Rua Domingos de Morais, 1200 - São Paulo/SP", contato: "(11) 92222-8888" },
  "Supermercado Família": { lat: -23.5299, lng: -46.6113, endereco: "Av. Jabaquara, 920 - São Paulo/SP", contato: "(11) 91111-9999" },
  "Hipermercado Barato": { lat: -23.4942, lng: -46.5337, endereco: "Av. Tiradentes, 2000 - Guarulhos/SP", contato: "(11) 90000-0000" },
  "Distribuidora Sul": { lat: -19.9074, lng: -43.9348, endereco: "Av. Amazonas, 3300 - Belo Horizonte/MG", contato: "(31) 98888-1212" },
};

const PRIORIDADE_STATUS_TAREFA: Record<string, number> = {
  "Em Andamento": 0,
  "Pendente": 1,
  "Atrasada": 2,
  "Concluída": 3,
};

const TILE_SIZE = 256;
const MAP_DEFAULT_WIDTH_PX = 920;
const MAP_HEIGHT_PX = 420;
const MAP_MIN_HEIGHT_PX = 310;
const MAP_FIT_WIDTH_RATIO = 0.62;
const MAP_FIT_HEIGHT_RATIO = 0.52;
const MAP_MIN_ZOOM = 3;
const MAP_MAX_ZOOM = 18;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getTarefaPrioritariaDoVeiculo(veiculo: Veiculo): Tarefa | null {
  const tarefasVeiculo = TAREFAS.filter((t) => t.veiculo === veiculo.placa);
  if (tarefasVeiculo.length === 0) return null;
  return [...tarefasVeiculo].sort((a, b) => {
    const pa = PRIORIDADE_STATUS_TAREFA[a.status] ?? 99;
    const pb = PRIORIDADE_STATUS_TAREFA[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.ordem - b.ordem;
  })[0] ?? null;
}

function getTarefaRotaLabel(veiculo: Veiculo): string {
  const tarefaAtual = getTarefaPrioritariaDoVeiculo(veiculo);
  if (!tarefaAtual) return "--";
  if (tarefaAtual.concluida) return `${tarefaAtual.idTarefa} - Rota finalizada`;
  if (tarefaAtual.deslocamentos.length === 0) return `${tarefaAtual.idTarefa} - Aguardando início`;

  const deslocamentoEmCurso = tarefaAtual.deslocamentos.find((d) => !d.horarioFinal);
  const ordemRota = deslocamentoEmCurso?.ordem ?? tarefaAtual.deslocamentos[tarefaAtual.deslocamentos.length - 1].ordem;
  return `${tarefaAtual.idTarefa} - Rota ${ordemRota}`;
}

function getLocalizacaoFicticia(nome: string, veiculo: Veiculo, index: number): LocalizacaoFicticia {
  const existente = LOCALIZACOES_FICTICIAS[nome];
  if (existente) return existente;

  const deslocamento = (index + 1) * 0.012;
  const sentido = nome.length % 2 === 0 ? 1 : -1;
  return {
    lat: veiculo.lat + deslocamento * sentido,
    lng: veiculo.lng - deslocamento * sentido,
    endereco: `${nome} - ponto fictício`,
  };
}

function normalizarNomeLocal(local: string | null | undefined): string {
  if (!local) return "";
  const limpo = local.trim();
  if (!limpo || limpo === "-") return "";
  return limpo.replace(/\s*\(.*\)\s*$/, "").trim();
}

function getEnderecoAtualVeiculoMock(veiculo: Veiculo, tarefa: Tarefa | null): string {
  const localAtual = normalizarNomeLocal(tarefa?.atual);
  if (localAtual) return getLocalizacaoFicticia(localAtual, veiculo, 90).endereco;

  const proximoCliente = normalizarNomeLocal(tarefa?.proximoCliente);
  if (proximoCliente) return getLocalizacaoFicticia(proximoCliente, veiculo, 91).endereco;

  const galpaoOperacao = GALPAO_POR_OPERACAO[veiculo.operacao] ?? "Origem da operação";
  return getLocalizacaoFicticia(galpaoOperacao, veiculo, 92).endereco;
}

function montarTrackingMarkersMock(veiculo: Veiculo, pedidosBase?: Pedido[]): TrackingMarkerMock[] {
  const cor = COR_OPERACAO_MOCK[veiculo.operacao] ?? "#1E3C7D";
  const tarefa = getTarefaPrioritariaDoVeiculo(veiculo);
  const enderecoAtualVeiculo = getEnderecoAtualVeiculoMock(veiculo, tarefa);
  const origemNome =
    tarefa?.timeline.find((item) => item.tipo === "galpao")?.nome ??
    GALPAO_POR_OPERACAO[veiculo.operacao] ??
    "Origem da operação";
  const origem = getLocalizacaoFicticia(origemNome, veiculo, 0);

  const markers: TrackingMarkerMock[] = [
    {
      latitude: origem.lat.toFixed(6),
      longitude: origem.lng.toFixed(6),
      tipo: "origem",
      placa: veiculo.placa,
      cor,
      endereco: origem.endereco,
      contato: origem.contato ?? null,
      entityID: `op-${slugify(origemNome)}`,
      opId: veiculo.operacao,
      entregue: null,
      naoEntregue: null,
      comRessalva: null,
      addressId: `addr-${slugify(origemNome)}`,
      nome: origemNome,
      descricao: `Origem da rota da operação ${veiculo.operacao}`,
    },
    {
      latitude: veiculo.lat.toFixed(6),
      longitude: veiculo.lng.toFixed(6),
      tipo: "veiculo",
      placa: veiculo.placa,
      cor,
      endereco: enderecoAtualVeiculo,
      contato: null,
      entityID: `veh-${veiculo.id}`,
      opId: veiculo.operacao,
      entregue: null,
      naoEntregue: null,
      comRessalva: null,
      addressId: null,
      nome: `Veículo ${veiculo.placa}`,
      descricao: `Status: ${veiculo.statusOperacional}`,
    },
  ];

  const pedidosDaRota = pedidosBase ?? (
    tarefa
      ? veiculo.pedidos.filter((pedido) => tarefa.listaPedidos.includes(pedido.nPedido))
      : veiculo.pedidos
  );

  const pedidosPorCliente = new Map<string, Pedido[]>();
  for (const pedido of pedidosDaRota) {
    const listaCliente = pedidosPorCliente.get(pedido.cliente) ?? [];
    pedidosPorCliente.set(pedido.cliente, [...listaCliente, pedido]);
  }

  const clientesTimeline = (tarefa?.timeline ?? [])
    .filter((item) => item.tipo !== "galpao")
    .map((item) => item.nome);
  const clientesOrdenados: string[] = [];
  for (const cliente of clientesTimeline) {
    if (pedidosPorCliente.has(cliente) && !clientesOrdenados.includes(cliente)) {
      clientesOrdenados.push(cliente);
    }
  }
  for (const cliente of pedidosPorCliente.keys()) {
    if (!clientesOrdenados.includes(cliente)) clientesOrdenados.push(cliente);
  }

  clientesOrdenados.forEach((cliente, idx) => {
    const local = getLocalizacaoFicticia(cliente, veiculo, idx + 1);
    const pedidosCliente = pedidosPorCliente.get(cliente) ?? [];
    const pedidosEntregues = pedidosCliente.filter((pedido) => pedido.status === "Entregue").length;
    const pedidosComRessalva = pedidosCliente.filter(
      (pedido) => pedido.status === "Com Ressalvas" || pedido.tipoRessalva !== null
    ).length;
    const todosPedidosEntregues = pedidosCliente.length > 0 && pedidosEntregues === pedidosCliente.length;

    markers.push({
      latitude: local.lat.toFixed(6),
      longitude: local.lng.toFixed(6),
      tipo: "destino",
      placa: veiculo.placa,
      cor,
      endereco: local.endereco,
      contato: local.contato ?? null,
      entityID: `cli-${slugify(cliente)}`,
      opId: null,
      entregue: todosPedidosEntregues ? "green" : null,
      naoEntregue: todosPedidosEntregues ? null : "gray",
      comRessalva: pedidosComRessalva > 0 ? "orange" : null,
      addressId: `addr-${slugify(cliente)}`,
      nome: cliente,
      descricao: pedidosCliente.length > 0
        ? `Pedidos: ${pedidosCliente.map((pedido) => pedido.nPedido).join(", ")}`
        : "Cliente vinculado à tarefa",
      pedidosCliente: pedidosCliente.map((pedido) => pedido.nPedido),
    });
  });

  return markers;
}

function longitudeToWorldX(longitude: number, zoom: number): number {
  return ((longitude + 180) / 360) * (2 ** zoom) * TILE_SIZE;
}

function latitudeToWorldY(latitude: number, zoom: number): number {
  const clampedLat = Math.max(Math.min(latitude, 85.05112878), -85.05112878);
  const latRad = (clampedLat * Math.PI) / 180;
  const mercator = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  return ((1 - mercator / Math.PI) / 2) * (2 ** zoom) * TILE_SIZE;
}

function escolherZoom(points: Array<{ lat: number; lng: number }>, width: number, height: number): number {
  if (points.length <= 1) return 14;

  for (let zoom = 16; zoom >= 3; zoom -= 1) {
    const worldPoints = points.map((point) => ({
      x: longitudeToWorldX(point.lng, zoom),
      y: latitudeToWorldY(point.lat, zoom),
    }));
    const minX = Math.min(...worldPoints.map((point) => point.x));
    const maxX = Math.max(...worldPoints.map((point) => point.x));
    const minY = Math.min(...worldPoints.map((point) => point.y));
    const maxY = Math.max(...worldPoints.map((point) => point.y));
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    if (spanX <= width * MAP_FIT_WIDTH_RATIO && spanY <= height * MAP_FIT_HEIGHT_RATIO) return zoom;
  }
  return 3;
}

function IconeMarcadorLocalizacao({ marker }: { marker: TrackingMarkerMock | MarkerPixel }) {
  const { tipo } = marker;
  const IconeInterno = tipo === "veiculo" ? Truck : tipo === "origem" ? Warehouse : Package;
  const classeBase = "h-8 w-8 rounded-full border-2 border-white shadow-md flex items-center justify-center";
  const destinoEntregue = tipo === "destino" && marker.entregue === "green";
  const classeCor = tipo === "veiculo"
    ? "bg-blue-600"
    : tipo === "destino"
      ? destinoEntregue
        ? "bg-emerald-600"
        : "bg-slate-500"
      : "bg-slate-600";

  return (
    <div className="relative">
      <div className={`${classeBase} ${classeCor}`}>
        <IconeInterno size={16} className="text-white" strokeWidth={2.3} />
      </div>
      {tipo === "destino" && marker.comRessalva && (
        <div
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-orange-500 shadow"
          title="Cliente com ressalva"
        >
          <AlertTriangle size={10} className="relative translate-y-[0.2px] text-white" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
}

function StreetMapMock({ markers }: { markers: TrackingMarkerMock[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapWidthPx, setMapWidthPx] = useState(MAP_DEFAULT_WIDTH_PX);
  const mapWidth = Math.max(320, mapWidthPx);

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;

    const atualizarLargura = () => {
      const next = Math.floor(element.getBoundingClientRect().width);
      if (next > 0) setMapWidthPx(next);
    };

    atualizarLargura();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(atualizarLargura);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", atualizarLargura);
    return () => window.removeEventListener("resize", atualizarLargura);
  }, []);

  const parsedMarkers = useMemo(
    () =>
      markers
        .map((marker) => ({
          ...marker,
          lat: Number(marker.latitude),
          lng: Number(marker.longitude),
        }))
        .filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng)),
    [markers]
  );

  const initialView = useMemo(() => {
    if (parsedMarkers.length === 0) return null;
    const points = parsedMarkers.map((marker) => ({ lat: marker.lat, lng: marker.lng }));
    const zoom = escolherZoom(points, mapWidth, MAP_HEIGHT_PX);
    const worldPoints = parsedMarkers.map((marker) => ({
      x: longitudeToWorldX(marker.lng, zoom),
      y: latitudeToWorldY(marker.lat, zoom),
    }));
    const minX = Math.min(...worldPoints.map((point) => point.x));
    const maxX = Math.max(...worldPoints.map((point) => point.x));
    const minY = Math.min(...worldPoints.map((point) => point.y));
    const maxY = Math.max(...worldPoints.map((point) => point.y));
    return {
      zoom,
      centerWorldX: (minX + maxX) / 2,
      centerWorldY: (minY + maxY) / 2,
    };
  }, [parsedMarkers, mapWidth]);

  const [view, setView] = useState<{ zoom: number; centerWorldX: number; centerWorldY: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startCenterWorldX: number;
    startCenterWorldY: number;
  } | null>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const activeView = view ?? initialView;
  if (!activeView) {
    return (
      <div
        className="mx-auto mt-3 mb-2 flex w-full items-center justify-center rounded border border-gray-300 bg-gray-50 text-xs text-gray-500"
        style={{ height: MAP_HEIGHT_PX, minHeight: MAP_MIN_HEIGHT_PX }}
      >
        Sem coordenadas para exibir no mapa.
      </div>
    );
  }

  const topLeftX = activeView.centerWorldX - mapWidth / 2;
  const topLeftY = activeView.centerWorldY - MAP_HEIGHT_PX / 2;
  const worldTileCount = 2 ** activeView.zoom;

  const minTileX = Math.floor(topLeftX / TILE_SIZE);
  const maxTileX = Math.floor((topLeftX + mapWidth) / TILE_SIZE);
  const minTileY = Math.floor(topLeftY / TILE_SIZE);
  const maxTileY = Math.floor((topLeftY + MAP_HEIGHT_PX) / TILE_SIZE);

  const tiles: TileInfo[] = [];
  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    if (tileY < 0 || tileY >= worldTileCount) continue;
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      const wrappedX = ((tileX % worldTileCount) + worldTileCount) % worldTileCount;
      tiles.push({
        key: `${activeView.zoom}-${tileX}-${tileY}`,
        x: tileX * TILE_SIZE - topLeftX,
        y: tileY * TILE_SIZE - topLeftY,
        src: `https://tile.openstreetmap.org/${activeView.zoom}/${wrappedX}/${tileY}.png`,
      });
    }
  }

  const markersComTela = parsedMarkers.map((marker) => {
    const worldX = longitudeToWorldX(marker.lng, activeView.zoom);
    const worldY = latitudeToWorldY(marker.lat, activeView.zoom);
    return {
      ...marker,
      worldX,
      worldY,
      x: worldX - topLeftX,
      y: worldY - topLeftY,
    };
  });
  const aplicarZoom = (targetZoom: number, focalX: number, focalY: number) => {
    setView((prev) => {
      const base = prev ?? initialView;
      if (!base) return prev;
      const nextZoom = Math.max(MAP_MIN_ZOOM, Math.min(MAP_MAX_ZOOM, targetZoom));
      if (nextZoom === base.zoom) return base;

      const oldTopLeftX = base.centerWorldX - mapWidth / 2;
      const oldTopLeftY = base.centerWorldY - MAP_HEIGHT_PX / 2;
      const worldPointX = oldTopLeftX + focalX;
      const worldPointY = oldTopLeftY + focalY;
      const factor = 2 ** (nextZoom - base.zoom);
      const worldPointXNext = worldPointX * factor;
      const worldPointYNext = worldPointY * factor;
      const newTopLeftX = worldPointXNext - focalX;
      const newTopLeftY = worldPointYNext - focalY;

      return {
        zoom: nextZoom,
        centerWorldX: newTopLeftX + mapWidth / 2,
        centerWorldY: newTopLeftY + MAP_HEIGHT_PX / 2,
      };
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const base = view ?? initialView;
    if (!base) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCenterWorldX: base.centerWorldX,
      startCenterWorldY: base.centerWorldY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const dragState = dragRef.current;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    setView((prev) => {
      const base = prev ?? initialView;
      if (!base) return prev;
      return {
        ...base,
        centerWorldX: dragState.startCenterWorldX - deltaX,
        centerWorldY: dragState.startCenterWorldY - deltaY,
      };
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const focalX = event.clientX - rect.left;
    const focalY = event.clientY - rect.top;
    const step = event.deltaY < 0 ? 1 : -1;
    aplicarZoom(activeView.zoom + step, focalX, focalY);
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const focalX = event.clientX - rect.left;
    const focalY = event.clientY - rect.top;
    aplicarZoom(activeView.zoom + 1, focalX, focalY);
  };

  return (
    <div
      ref={mapRef}
      className="relative mx-auto mt-3 mb-2 w-full overflow-hidden overscroll-contain rounded border border-gray-300 bg-slate-100 touch-none cursor-grab active:cursor-grabbing"
      style={{ height: MAP_HEIGHT_PX, minHeight: MAP_MIN_HEIGHT_PX }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheelCapture={onWheel}
      onDoubleClick={onDoubleClick}
    >
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.src}
          alt="OpenStreetMap tile"
          className="absolute max-w-none select-none"
          style={{ left: tile.x, top: tile.y, width: TILE_SIZE, height: TILE_SIZE }}
          draggable={false}
        />
      ))}

      {markersComTela.map((marker) => (
        <div
          key={marker.entityID}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: marker.x, top: marker.y }}
        >
          <IconeMarcadorLocalizacao marker={marker} />
          {marker.tipo === "origem" && (
            <div className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 hidden w-max max-w-[260px] -translate-x-1/2 rounded border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700 shadow-lg group-hover:block">
              <div className="font-semibold text-slate-900">Galpão: {marker.nome}</div>
            </div>
          )}
          {marker.tipo === "destino" && (
            <div className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 hidden w-max max-w-[260px] -translate-x-1/2 rounded border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700 shadow-lg group-hover:block">
              <div className="font-semibold text-slate-900">{marker.nome}</div>
              <div className="mt-0.5 text-slate-600">
                Pedidos: {marker.pedidosCliente && marker.pedidosCliente.length > 0 ? marker.pedidosCliente.join(", ") : "sem pedidos"}
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-[10px] text-gray-700 shadow">
        Mapa interativo: arraste, zoom no scroll e duplo clique
      </div>
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <button
          className="h-6 w-6 rounded bg-white/95 text-gray-800 shadow hover:bg-white"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => aplicarZoom(activeView.zoom + 1, mapWidth / 2, MAP_HEIGHT_PX / 2)}
          type="button"
        >
          +
        </button>
        <button
          className="h-6 w-6 rounded bg-white/95 text-gray-800 shadow hover:bg-white"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => aplicarZoom(activeView.zoom - 1, mapWidth / 2, MAP_HEIGHT_PX / 2)}
          type="button"
        >
          -
        </button>
      </div>
      <div className="absolute left-2 bottom-1 text-[9px] text-gray-700 bg-white/85 px-1.5 py-0.5 rounded">
        Zoom {activeView.zoom}
      </div>
      <div className="absolute bottom-1 right-2 text-[9px] text-gray-700 bg-white/85 px-1.5 py-0.5 rounded">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}

function ModalMapaVeiculoInner({
  veiculo,
  onClose,
  pedidoFoco,
}: {
  veiculo: Veiculo;
  onClose: () => void;
  pedidoFoco?: Pedido;
}) {
  useEffect(() => {
    const tituloAnterior = document.title;
    const aplicarTituloPlaca = () => {
      if (document.title !== veiculo.placa) {
        document.title = veiculo.placa;
      }
    };

    aplicarTituloPlaca();
    const rafId = window.requestAnimationFrame(aplicarTituloPlaca);
    const intervalId = window.setInterval(aplicarTituloPlaca, 500);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearInterval(intervalId);
      document.title = tituloAnterior;
    };
  }, [veiculo.placa]);

  const tarefaAtual = useMemo(() => getTarefaPrioritariaDoVeiculo(veiculo), [veiculo]);
  const infoRotaAtual = useMemo(() => {
    if (!tarefaAtual) return "Sem rota em andamento";
    const dataBase = tarefaAtual.dataRoteirizacao?.split(" ")[0] ?? "";
    const inicio = tarefaAtual.inicio ? `${dataBase ? `${dataBase} ` : ""}${tarefaAtual.inicio}` : "--";
    const termino = tarefaAtual.termino ? `${dataBase ? `${dataBase} ` : ""}${tarefaAtual.termino}` : "--";
    return `Rota: ${tarefaAtual.idTarefa} | Início: ${inicio} | Término: ${termino}`;
  }, [tarefaAtual]);
  const pedidosDoVeiculo = useMemo(
    () => [...veiculo.pedidos].sort((a, b) => a.nPedido.localeCompare(b.nPedido)),
    [veiculo]
  );
  const clientesDoVeiculo = useMemo(
    () => [...new Set(pedidosDoVeiculo.map((pedido) => pedido.cliente))].sort((a, b) => a.localeCompare(b)),
    [pedidosDoVeiculo]
  );
  const pedidoFocoNoVeiculo = useMemo(() => {
    if (!pedidoFoco) return null;
    return pedidosDoVeiculo.find((pedido) => pedido.nPedido === pedidoFoco.nPedido) ?? null;
  }, [pedidoFoco, pedidosDoVeiculo]);
  const [dropdownPedidosAberto, setDropdownPedidosAberto] = useState(false);
  const dropdownPedidosRef = useRef<HTMLDivElement | null>(null);
  const [dropdownClientesAberto, setDropdownClientesAberto] = useState(false);
  const dropdownClientesRef = useRef<HTMLDivElement | null>(null);
  const [pedidosSelecionados, setPedidosSelecionados] = useState<string[]>([]);
  const [clientesSelecionados, setClientesSelecionados] = useState<string[]>([]);
  const [autoAtualizarModal, setAutoAtualizarModal] = useState(false);
  const [autoCountdownModal, setAutoCountdownModal] = useState(30);
  const [lastUpdateModal, setLastUpdateModal] = useState("");

  const handleAtualizarModal = useCallback(() => {
    setLastUpdateModal(
      new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, []);

  useEffect(() => {
    if (pedidoFocoNoVeiculo) {
      setClientesSelecionados([pedidoFocoNoVeiculo.cliente]);
      setPedidosSelecionados([pedidoFocoNoVeiculo.nPedido]);
      return;
    }
    setClientesSelecionados(clientesDoVeiculo);
    setPedidosSelecionados(pedidosDoVeiculo.map((pedido) => pedido.nPedido));
  }, [pedidoFocoNoVeiculo, pedidosDoVeiculo, clientesDoVeiculo]);

  useEffect(() => {
    handleAtualizarModal();
  }, [handleAtualizarModal]);

  useEffect(() => {
    if (!autoAtualizarModal) {
      setAutoCountdownModal(30);
      return;
    }

    handleAtualizarModal();
    setAutoCountdownModal(30);

    const interval = setInterval(() => {
      setAutoCountdownModal((prev) => {
        if (prev <= 1) {
          handleAtualizarModal();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoAtualizarModal, handleAtualizarModal]);

  useEffect(() => {
    if (!dropdownPedidosAberto) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownPedidosRef.current?.contains(event.target as Node)) return;
      setDropdownPedidosAberto(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownPedidosAberto]);

  useEffect(() => {
    if (!dropdownClientesAberto) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownClientesRef.current?.contains(event.target as Node)) return;
      setDropdownClientesAberto(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownClientesAberto]);

  const pedidosSelecionadosSet = useMemo(
    () => new Set(pedidosSelecionados),
    [pedidosSelecionados]
  );
  const clientesSelecionadosSet = useMemo(
    () => new Set(clientesSelecionados),
    [clientesSelecionados]
  );
  const filtroClientesAtivo = useMemo(
    () => clientesSelecionadosSet.size > 0 && clientesSelecionadosSet.size < clientesDoVeiculo.length,
    [clientesSelecionadosSet, clientesDoVeiculo]
  );
  const clientesSelecionadosDetalhe = useMemo(
    () => clientesDoVeiculo.filter((cliente) => clientesSelecionadosSet.has(cliente)),
    [clientesDoVeiculo, clientesSelecionadosSet]
  );
  const pedidosSelecionadosDetalhe = useMemo(
    () =>
      pedidosDoVeiculo.filter(
        (pedido) =>
          pedidosSelecionadosSet.has(pedido.nPedido) &&
          (!filtroClientesAtivo || clientesSelecionadosSet.has(pedido.cliente))
      ),
    [pedidosDoVeiculo, pedidosSelecionadosSet, clientesSelecionadosSet, filtroClientesAtivo]
  );
  const gruposClientesPedidos = useMemo(() => {
    const mapa = new Map<string, Pedido[]>();
    for (const pedido of pedidosSelecionadosDetalhe) {
      const listaCliente = mapa.get(pedido.cliente) ?? [];
      listaCliente.push(pedido);
      mapa.set(pedido.cliente, listaCliente);
    }
    return [...mapa.entries()]
      .map(([cliente, pedidos]) => ({
        cliente,
        pedidos: [...pedidos].sort((a, b) => a.nPedido.localeCompare(b.nPedido)),
      }))
      .sort((a, b) => a.cliente.localeCompare(b.cliente));
  }, [pedidosSelecionadosDetalhe]);
  const trackingMarkersBase = useMemo(
    () => montarTrackingMarkersMock(veiculo, pedidosDoVeiculo),
    [veiculo, pedidosDoVeiculo]
  );
  const trackingMarkers = useMemo(() => {
    return trackingMarkersBase.filter((marker) => {
      if (marker.tipo !== "destino") return true;
      if (pedidosSelecionadosSet.size === 0 || clientesSelecionadosSet.size === 0) return false;
      const pertenceAoPedidoSelecionado =
        marker.pedidosCliente?.some((pedidoNum) => pedidosSelecionadosSet.has(pedidoNum)) ?? false;
      if (!pertenceAoPedidoSelecionado) return false;
      if (!filtroClientesAtivo) return true;
      const clienteSelecionado = clientesSelecionadosSet.has(marker.nome);
      return clienteSelecionado;
    });
  }, [trackingMarkersBase, pedidosSelecionadosSet, clientesSelecionadosSet, filtroClientesAtivo]);
  const origem = trackingMarkers.find((marker) => marker.tipo === "origem");
  const posicaoVeiculo = trackingMarkers.find((marker) => marker.tipo === "veiculo");
  const destinos = trackingMarkers.filter((marker) => marker.tipo === "destino");
  const totaisPedidos = useMemo(
    () =>
      pedidosSelecionadosDetalhe.reduce(
        (acc, pedido) => {
          acc.volumes += pedido.qtdVolumes;
          acc.volumesTotal += pedido.qtdVolumesTotal;
          acc.peso += pedido.peso;
          acc.cubagem += pedido.cubagem;
          acc.valor += pedido.valorTotal;
          return acc;
        },
        { volumes: 0, volumesTotal: 0, peso: 0, cubagem: 0, valor: 0 }
      ),
    [pedidosSelecionadosDetalhe]
  );
  const resumoPedidosSelecionados = useMemo(() => {
    if (pedidosSelecionadosDetalhe.length === 0) return "Nenhum pedido selecionado";
    if (pedidosSelecionadosDetalhe.length === 1) return `Pedido ${pedidosSelecionadosDetalhe[0].nPedido}`;
    return `${pedidosSelecionadosDetalhe.length} pedidos selecionados`;
  }, [pedidosSelecionadosDetalhe]);
  const resumoClientesSelecionados = useMemo(() => {
    if (clientesSelecionadosDetalhe.length === 0) return "Nenhum cliente selecionado";
    if (clientesSelecionadosDetalhe.length === 1) return clientesSelecionadosDetalhe[0];
    return `${clientesSelecionadosDetalhe.length} clientes selecionados`;
  }, [clientesSelecionadosDetalhe]);

  function aplicarFiltroPedidos(proximosPedidos: string[]) {
    setPedidosSelecionados(proximosPedidos);
    const setPedidos = new Set(proximosPedidos);
    const clientesComPedidoSelecionado = clientesDoVeiculo.filter((cliente) =>
      pedidosDoVeiculo.some((pedido) => pedido.cliente === cliente && setPedidos.has(pedido.nPedido))
    );
    setClientesSelecionados(clientesComPedidoSelecionado);
  }

  function alternarPedidoSelecionado(pedidoNum: string) {
    const proximosPedidos = pedidosSelecionados.includes(pedidoNum)
      ? pedidosSelecionados.filter((num) => num !== pedidoNum)
      : [...pedidosSelecionados, pedidoNum];
    aplicarFiltroPedidos(proximosPedidos);
  }

  function aplicarFiltroClientes(proximosClientes: string[]) {
    setClientesSelecionados(proximosClientes);
    const setClientes = new Set(proximosClientes);
    const pedidosDoCliente = pedidosDoVeiculo
      .filter((pedido) => setClientes.has(pedido.cliente))
      .map((pedido) => pedido.nPedido);
    setPedidosSelecionados(pedidosDoCliente);
  }

  function alternarClienteSelecionado(cliente: string) {
    const proximosClientes = clientesSelecionados.includes(cliente)
      ? clientesSelecionados.filter((nome) => nome !== cliente)
      : [...clientesSelecionados, cliente];
    aplicarFiltroClientes(proximosClientes);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-[1040px] max-w-[96vw] max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a3c6e] text-white">
          <div>
            <h2 className="text-sm font-semibold">Localização do Veículo</h2>
            <p className="text-blue-200 text-xs">{veiculo.placa} - {veiculo.motorista}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex min-h-0 flex-col overflow-y-auto">
          <div className="px-4 pt-3 flex flex-wrap gap-2 text-[11px]">
            <div className="relative" ref={dropdownPedidosRef}>
              <button
                type="button"
                onClick={() => {
                  setDropdownPedidosAberto((valor) => !valor);
                  setDropdownClientesAberto(false);
                }}
                className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700"
              >
                <span>{resumoPedidosSelecionados}</span>
                <ChevronDown size={12} className={`transition-transform ${dropdownPedidosAberto ? "rotate-180" : ""}`} />
              </button>
              {dropdownPedidosAberto && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[320px] rounded border border-blue-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-gray-100 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => aplicarFiltroPedidos(pedidosDoVeiculo.map((pedido) => pedido.nPedido))}
                      className="text-[10px] font-medium text-blue-600 hover:underline"
                    >
                      Selecionar todos
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarFiltroPedidos([])}
                      className="text-[10px] font-medium text-red-600 hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto p-1">
                    {pedidosDoVeiculo.map((pedido) => (
                      <label
                        key={pedido.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-blue-50"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3 accent-blue-600"
                          checked={pedidosSelecionadosSet.has(pedido.nPedido)}
                          onChange={() => alternarPedidoSelecionado(pedido.nPedido)}
                        />
                        <span className="font-mono text-[10px] text-blue-700">Pedido {pedido.nPedido}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={dropdownClientesRef}>
              <button
                type="button"
                onClick={() => {
                  setDropdownClientesAberto((valor) => !valor);
                  setDropdownPedidosAberto(false);
                }}
                className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700"
              >
                <span>{resumoClientesSelecionados}</span>
                <ChevronDown size={12} className={`transition-transform ${dropdownClientesAberto ? "rotate-180" : ""}`} />
              </button>
              {dropdownClientesAberto && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[320px] rounded border border-emerald-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-gray-100 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => aplicarFiltroClientes(clientesDoVeiculo)}
                      className="text-[10px] font-medium text-emerald-700 hover:underline"
                    >
                      Selecionar todos
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarFiltroClientes([])}
                      className="text-[10px] font-medium text-red-600 hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto p-1">
                    {clientesDoVeiculo.map((cliente) => (
                      <label
                        key={cliente}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-emerald-50"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3 accent-emerald-600"
                          checked={clientesSelecionadosSet.has(cliente)}
                          onChange={() => alternarClienteSelecionado(cliente)}
                        />
                        <span className="truncate text-[11px] text-gray-700">{cliente}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="rounded bg-slate-50 border border-slate-200 px-2 py-1 text-slate-700">
              {infoRotaAtual}
            </span>
            <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-emerald-700">
              Clientes no mapa: {destinos.length}
            </span>
            <span className="rounded bg-slate-50 border border-slate-200 px-2 py-1 text-slate-700">
              Posição atual: {veiculo.lat.toFixed(6)}, {veiculo.lng.toFixed(6)}
            </span>
            {posicaoVeiculo?.endereco && (
              <span className="rounded bg-slate-50 border border-slate-200 px-2 py-1 text-slate-700">
                Endereço atual: {posicaoVeiculo.endereco}
              </span>
            )}
            {origem && (
              <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-1 text-indigo-700">
                Origem: {origem.nome}
              </span>
            )}
            <span className="rounded bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700">
              Última atualização: <strong className="text-gray-800">{lastUpdateModal}</strong>
            </span>
            <button
              type="button"
              onClick={() => setAutoAtualizarModal(!autoAtualizarModal)}
              className={`flex items-center gap-1.5 h-7 px-2.5 text-[11px] rounded border transition-colors ${
                autoAtualizarModal
                  ? "bg-green-50 border-green-400 text-green-700"
                  : "bg-white border-gray-300 text-gray-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoAtualizarModal ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
              {autoAtualizarModal ? `AUTO - ${autoCountdownModal}s` : "OFF"}
            </button>
            <button
              type="button"
              onClick={handleAtualizarModal}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] rounded border border-blue-400 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <RefreshCw size={12} />
              Atualizar
            </button>
          </div>

          <StreetMapMock markers={trackingMarkers} />

          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Informações do Veículo</h3>
              <div className="space-y-1 text-xs">
                {[
                  ["Placa", veiculo.placa],
                  ["Classe", veiculo.classe],
                  ["Operação", veiculo.operacao],
                  ["Status", veiculo.statusOperacional],
                  ["Volume", veiculo.volumeEmbarcado],
                  ["Tipo de contrato", veiculo.transportadora],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-100 pb-0.5">
                    <span className="text-gray-500">{k}:</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Motorista</h3>
              <div className="space-y-1 text-xs">
                {[
                  ["Nome", veiculo.motorista],
                  ["Ajudante", veiculo.ajudante],
                  ["Roteirizado", veiculo.roteirizado ? "Sim" : "Não"],
                  ["Dt. Roteirização", veiculo.dataRoteirizacao || "-"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-100 pb-0.5">
                    <span className="text-gray-500">{k}:</span>
                    <span className="font-medium text-gray-800">{v as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pb-2">
            <div className="border border-blue-200 rounded-md overflow-hidden">
              <div className="bg-blue-700/10 px-3 py-1.5 border-b border-blue-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-blue-800">
                    Pedidos selecionados ({pedidosSelecionadosDetalhe.length})
                  </span>
                </div>
              </div>
              <div className="overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="w-7" />
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">#</th>
                      {["Cliente / Pedido", "Remessa", "Status", "Vol.", "Peso", "Cubagem", "Valor", "Ressalva"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {gruposClientesPedidos.map((grupo, index) => (
                      <LinhaClienteModalMapa
                        key={grupo.cliente}
                        cliente={grupo.cliente}
                        pedidos={grupo.pedidos}
                        index={index + 1}
                      />
                    ))}
                    {pedidosSelecionadosDetalhe.length > 0 ? (
                      <TotalRow>
                        <td />
                        <td className="px-3 py-2 text-[11px] text-gray-500">#</td>
                        <td colSpan={3} className="px-3 py-2 text-[10px] text-gray-500 uppercase">Total</td>
                        <td className="px-3 py-2 text-[11px] text-center">{`${totaisPedidos.volumes}/${totaisPedidos.volumesTotal}`}</td>
                        <td className="px-3 py-2 text-[11px]">{fmt(totaisPedidos.peso, "peso")}</td>
                        <td className="px-3 py-2 text-[11px]">{fmt(totaisPedidos.cubagem, "cubagem")}</td>
                        <td className="px-3 py-2 text-[11px]">{fmt(totaisPedidos.valor, "moeda")}</td>
                        <td />
                      </TotalRow>
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-3 text-center text-xs text-gray-400">
                          Nenhum pedido selecionado para exibir no mapa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalMapaVeiculo(props: { veiculo: Veiculo; onClose: () => void; pedidoFoco?: Pedido }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(<ModalMapaVeiculoInner {...props} />, document.body);
}

// â”€â”€â”€ Linha de Veículo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LinhaVeiculo({
  veiculo,
  filtroStatus,
  index,
  onAbrirMapa,
}: {
  veiculo: Veiculo;
  filtroStatus: StatusPedido[];
  index: number;
  onAbrirMapa: (v: Veiculo) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const formatarOrdemCliente = (cliente: string | undefined, ordem: number) => (cliente ? `${ordem}°-${cliente}` : "--");
  const tipoRessalvaVeiculo: "No Pedido" | "No Item" | null = veiculo.pedidos.some((p) => p.tipoRessalva === "No Pedido")
    ? "No Pedido"
    : veiculo.pedidos.some((p) => p.tipoRessalva === "No Item")
      ? "No Item"
      : null;
  const ressalvaSemFotoVeiculo = veiculo.pedidos.some(
    (p) => p.tipoRessalva !== null && (p.ressalvas.length === 0 || p.ressalvas.some((r) => !r.temFoto))
  );
  const semComprovanteVeiculo = veiculo.pedidos.some((p) => !p.comComprovante);

  const pedidosFiltrados = filtroStatus.length > 0
    ? veiculo.pedidos.filter((p) =>
        filtroStatus.some((status) => {
          if (status === "Com Ressalvas") return p.tipoRessalva !== null || p.ressalvas.length > 0;
          if (status === "Parcialmente Embarcado") {
            return isPedidoParcialmenteEmbarcado(p);
          }
          return p.status === status;
        })
      )
    : veiculo.pedidos;
  const veiculoFinalizado = veiculo.status === "Finalizado" || veiculo.statusOperacional === "Concluído";
  const pedidosEmAberto = veiculoFinalizado
    ? []
    : veiculo.pedidos.filter((p) => p.status !== "Entregue" && p.status !== "Com Ressalvas");
  const atualCliente = formatarOrdemCliente(pedidosEmAberto[0]?.cliente, 1);
  const proximoCliente = formatarOrdemCliente(pedidosEmAberto[1]?.cliente, 2);

  return (
    <>
      <tr
        onClick={() => setExpandido(!expandido)}
        className={`border-t border-gray-100 cursor-pointer transition-colors ${expandido ? "bg-blue-50/60" : "hover:bg-gray-50"}`}
      >
        <td className="pl-3 pr-1 py-2 w-7">
          <button className="text-gray-400 hover:text-blue-600">
            {expandido ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </td>
        <td className="px-2 py-2 text-[11px] text-center text-gray-500">{index}</td>
        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAbrirMapa(veiculo)}
            className="text-blue-700 font-semibold text-[11px] hover:underline font-mono"
          >
            {veiculo.placa}
          </button>
        </td>
        <td className="px-2 py-2 text-[11px]">{veiculo.operacao}</td>
        <td className="px-2 py-2 text-[11px]">{veiculo.classe}</td>
        <td className="px-2 py-2 text-[11px]">{veiculo.tipoClimatizacao}</td>
        <td className="px-2 py-2 text-[11px]">{veiculo.motorista}</td>
        <td className="px-2 py-2 text-[11px]">{veiculo.ajudante}</td>
        <td className="px-2 py-2 text-[11px]">{veiculo.transportadora}</td>
        <td className="px-2 py-2"><StatusBadge status={veiculo.status} /></td>
        <td className="px-2 py-2 text-[11px]">{atualCliente}</td>
        <td className="px-2 py-2 text-[11px]">{proximoCliente}</td>
        <td className="px-2 py-2 text-[11px] text-center">{veiculo.dataRoteirizacao || "-"}</td>
        <td className="px-2 py-2 text-[11px] text-center font-medium">{veiculo.volumeEmbarcado}</td>
        <td className="px-2 py-2 text-[11px] text-center">{veiculo.qtdPedidos}</td>
        <td className="px-2 py-2 text-[11px]">{getTarefaRotaLabel(veiculo)}</td>
        <td className="px-2 py-2 text-[11px]">
          {tipoRessalvaVeiculo ? (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${tipoRessalvaVeiculo === "No Pedido" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
              {tipoRessalvaVeiculo}
              {ressalvaSemFotoVeiculo && (
                <>
                  <span>-</span>
                  <CameraOff size={12} />
                </>
              )}
            </span>
          ) : (
            <span className="text-gray-300 text-[10px]">-</span>
          )}
        </td>
        <td className="px-2 py-2">
          {semComprovanteVeiculo ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <IconeComprovante tem={false} />
              <span className="text-[10px]">-</span>
              <CameraOff size={12} />
            </span>
          ) : (
            <IconeComprovante tem={true} />
          )}
        </td>
        <td className="px-2 py-2 text-[11px]  font-medium">{fmt(veiculo.valorTotal, "moeda")}</td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={veiculo.validacao.entregaRoterizada} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={veiculo.validacao.volumeEmbarcadoVal} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={veiculo.validacao.registroEntrega} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={veiculo.validacao.chegadaSaidaInformada} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={veiculo.validacao.rotaFinalizada} /></td>
        <td className="px-2 py-2 text-center">
          <div className="flex items-center gap-1 justify-center">
            <ResultadoBadge validacao={veiculo.validacao} />
          </div>
        </td>
        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <ElipsisMenu items={[
            { label: "Exportar Pedidos desse Veículo", icon: <Download size={12} />, action: () => alert(`Exportando pedidos de ${veiculo.placa}`) },
            { label: "Exportar Volumes desse Veículo", icon: <Download size={12} />, action: () => alert(`Exportando volumes de ${veiculo.placa}`) },
            { label: "Exportar Itens desse Veículo", icon: <Download size={12} />, action: () => alert(`Exportando itens de ${veiculo.placa}`) },
            { label: "Exportar Comprovantes desse Veículo", icon: <Download size={12} />, action: () => alert(`Exportando comprovantes de ${veiculo.placa}`) },
            { label: "Exportar Ressalvas desse Veículo", icon: <Download size={12} />, action: () => alert(`Exportando ressalvas de ${veiculo.placa}`) },
          ]} />
        </td>
      </tr>

      {expandido && pedidosFiltrados.length > 0 && (
        <tr>
          <td colSpan={28} className="px-6 pb-4 bg-blue-50/30">
            <div className="mt-2 border border-blue-200 rounded-md overflow-hidden">
              <div className="bg-blue-700/10 px-3 py-1.5 flex items-center justify-between border-b border-blue-200">
                <span className="text-[11px] font-semibold text-blue-800">
                  Pedidos do Veículo {veiculo.placa} ({pedidosFiltrados.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="w-7" />
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-blue-800 uppercase">#</th>
                      {["Operação","Nº Pedido","Remessa","Cliente","Rota","Tipo Serv.","Dt. Agend.","Vol. Emb.","Peso","Cubagem","Valor Total","Status","Prior.","Comprovante","Ressalva","Roterizada?","Vol. Emb.?","Reg. Entrega?","Cheg./Saída?","Rota Final.?","Andamento","Ações"].map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left text-[10px] font-semibold text-blue-800 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {pedidosFiltrados.map((pedido, index) => (
                      <LinhaPedidoVeiculo key={pedido.id} pedido={pedido} filtroStatus={filtroStatus} index={index + 1} />
                    ))}
                    <TotalRow>
                      <td />
                      <td className="px-2 py-1.5 text-[11px] text-center text-gray-500">#</td>
                      <td colSpan={8} className="px-3 py-1.5 text-[10px] text-gray-500 uppercase">Total</td>
                      <td className="px-2 py-1.5 text-[11px] ">{fmt(pedidosFiltrados.reduce((s, p) => s + p.peso, 0), "peso")}</td>
                      <td className="px-2 py-1.5 text-[11px] ">{fmt(pedidosFiltrados.reduce((s, p) => s + p.cubagem, 0), "cubagem")}</td>
                      <td className="px-2 py-1.5 text-[11px] ">{fmt(pedidosFiltrados.reduce((s, p) => s + p.valorTotal, 0), "moeda")}</td>
                      <td colSpan={3} />
                    </TotalRow>
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}

      {expandido && pedidosFiltrados.length === 0 && (
        <tr>
          <td colSpan={28} className="px-6 py-4 text-center text-xs text-gray-400 bg-blue-50/30">
            Nenhum pedido encontrado com o filtro aplicado.
          </td>
        </tr>
      )}
    </>
  );
}

// â”€â”€â”€ Aba Veículos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AbaVeiculosProps {
  veiculos: Veiculo[];
  filtroStatus: StatusPedido[];
  filtroTransportadoraGlobal?: string;
}

export function AbaVeiculos({ veiculos, filtroStatus, filtroTransportadoraGlobal = "" }: AbaVeiculosProps) {
  const formatarOrdemCliente = (cliente: string | undefined, ordem: number) => (cliente ? `${ordem}°-${cliente}` : "--");
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [filtroMotorista, setFiltroMotorista] = useState("");
  const [filtroTransportadora, setFiltroTransportadora] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [filtroClimatizacao, setFiltroClimatizacao] = useState("");
  const [filtroRessalva, setFiltroRessalva] = useState("");
  const [filtroComprovante, setFiltroComprovante] = useState("");
  const [veiculoMapa, setVeiculoMapa] = useState<Veiculo | null>(null);
  const autoOpenHandledRef = useRef(false);

  useEffect(() => {
    if (autoOpenHandledRef.current) return;
    autoOpenHandledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get("modal") !== "veiculo") return;
    const tab = params.get("tab");
    if (tab && tab !== "veiculos") return;

    const placa = params.get("placa");
    if (!placa) return;
    const veiculo = veiculos.find((v) => v.placa === placa);
    if (!veiculo) return;
    setVeiculoMapa(veiculo);
  }, [veiculos]);

  const veiculosComValidacao = veiculos.map((v) => {
    const volumeEmbarcadoTotal = v.pedidos.reduce((s, p) => s + p.qtdVolumesTotal, 0);
    const volumeEmbarcadoAtual = v.pedidos.reduce((s, p) => s + p.qtdVolumes, 0);
    const veiculoFinalizado = v.status === "Finalizado" || v.statusOperacional === "Concluído";
    const pedidosEmAberto = veiculoFinalizado
      ? []
      : v.pedidos.filter((p) => p.status !== "Entregue" && p.status !== "Com Ressalvas");
    return {
      ...v,
      volumeEmbarcado: `${volumeEmbarcadoAtual}/${volumeEmbarcadoTotal}`,
      atual: formatarOrdemCliente(pedidosEmAberto[0]?.cliente, 1),
      proximoCliente: formatarOrdemCliente(pedidosEmAberto[1]?.cliente, 2),
      tarefaRota: getTarefaRotaLabel(v),
      valRoterizada: v.validacao.entregaRoterizada ? "Sim" : "Não",
      valVolEmb: v.validacao.volumeEmbarcadoVal ? "Sim" : "Não",
      valRegEntrega: v.validacao.registroEntrega ? "Sim" : "Não",
      valChegSaida: v.validacao.chegadaSaidaInformada ? "Sim" : "Não",
      valRotaFinal: v.validacao.rotaFinalizada ? "Sim" : "Não",
      valResultado: calcularResultado(v.validacao),
    };
  });

  const { sorted, sortConfig, handleSort } = useSortable(veiculosComValidacao, "placa");
  const { colFilters, setFilter, clearAllFilters, hasActiveFilters, applyColFilters, getUniqueValues } = useColFilters();

  const filtradosPorBarra = sorted.filter((v) => {
    const termoPlaca = filtroVeiculo.trim().toLowerCase();
    if (termoPlaca && !v.placa.toLowerCase().includes(termoPlaca)) return false;
    if (filtroMotorista && v.motorista !== filtroMotorista) return false;
    if (filtroTransportadoraGlobal && v.transportadora !== filtroTransportadoraGlobal) return false;
    if (filtroTransportadora && v.transportadora !== filtroTransportadora) return false;
    if (filtroClasse && v.classe !== filtroClasse) return false;
    if (filtroClimatizacao && v.tipoClimatizacao !== filtroClimatizacao) return false;
    if (filtroRessalva === "Com Ressalva" && !v.temRessalva) return false;
    if (filtroRessalva === "Sem Ressalva" && v.temRessalva) return false;
    if (filtroComprovante === "Com Comprovante" && !v.comComprovante) return false;
    if (filtroComprovante === "Sem Comprovante" && v.comComprovante) return false;
    if (filtroStatus.length > 0) {
      const temPedidoFiltrado = v.pedidos.some((p) => {
        return filtroStatus.some((status) => {
          if (status === "Com Ressalvas") return p.tipoRessalva !== null || p.ressalvas.length > 0;
          if (status === "Parcialmente Embarcado") {
            return isPedidoParcialmenteEmbarcado(p);
          }
          return p.status === status;
        });
      });
      if (!temPedidoFiltrado) return false;
    }
    return true;
  });

  // Aplica filtros de coluna por cima dos filtros de barra
  const filtrados = applyColFilters(filtradosPorBarra as Record<string, unknown>[]) as Veiculo[];
  const totalVolumesFiltrados = filtrados.reduce(
    (acc, v) => {
      acc.atual += v.pedidos.reduce((s, p) => s + p.qtdVolumes, 0);
      acc.total += v.pedidos.reduce((s, p) => s + p.qtdVolumesTotal, 0);
      return acc;
    },
    { atual: 0, total: 0 }
  );

  const uniq = (arr: string[]) => [...new Set(arr)].filter(Boolean).sort();
  function abrirMapaEmNovaAba(veiculo: Veiculo) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "veiculos");
    url.searchParams.set("modal", "veiculo");
    url.searchParams.set("placa", veiculo.placa);
    url.searchParams.delete("pedido");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Modal de mapa â€” fora da tabela para evitar div dentro de tbody */}
      {veiculoMapa && (
        <ModalMapaVeiculo veiculo={veiculoMapa} onClose={() => setVeiculoMapa(null)} />
      )}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-wrap">
        <input
          value={filtroVeiculo}
          onChange={(e) => setFiltroVeiculo(e.target.value)}
          placeholder="Pesquisar placa..."
          className="h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-40"
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center h-7 px-2.5 text-[11px] bg-blue-50 text-blue-700 rounded border border-blue-200">
            {filtrados.length} veículo(s)
          </span>
          <ActionDropdownButton
            label="Exportar"
            icon={<Download size={12} />}
            items={[
              { label: "Veículos", icon: <Download size={12} />, action: () => alert("Exportando veículos...") },
              { label: "Pedidos", icon: <Download size={12} />, action: () => alert("Exportando pedidos...") },
              { label: "Volumes", icon: <Download size={12} />, action: () => alert("Exportando volumes...") },
              { label: "Itens", icon: <Download size={12} />, action: () => alert("Exportando itens...") },
            ]}
          />
        </div>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 h-7 px-2.5 text-[11px] bg-blue-50 text-blue-700 rounded border border-blue-300 hover:bg-blue-100"
          >
            Limpar filtros de coluna ×
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="w-7" />
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">#</th>
              <ColFilterTh label="Placa" sortKey="placa" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "placa")} selected={colFilters["placa"] ?? new Set()} onFilterChange={(s) => setFilter("placa", s)} />
              <ColFilterTh label="Operação" sortKey="operacao" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "operacao")} selected={colFilters["operacao"] ?? new Set()} onFilterChange={(s) => setFilter("operacao", s)} />
              <ColFilterTh label="Classe" sortKey="classe" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "classe")} selected={colFilters["classe"] ?? new Set()} onFilterChange={(s) => setFilter("classe", s)} />
              <ColFilterTh label="Climatização" sortKey="tipoClimatizacao" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "tipoClimatizacao")} selected={colFilters["tipoClimatizacao"] ?? new Set()} onFilterChange={(s) => setFilter("tipoClimatizacao", s)} />
              <ColFilterTh label="Motorista" sortKey="motorista" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "motorista")} selected={colFilters["motorista"] ?? new Set()} onFilterChange={(s) => setFilter("motorista", s)} />
              <ColFilterTh label="Ajudante" sortKey="ajudante" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "ajudante")} selected={colFilters["ajudante"] ?? new Set()} onFilterChange={(s) => setFilter("ajudante", s)} />
              <ColFilterTh label="Tipo de Contrato" sortKey="transportadora" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "transportadora")} selected={colFilters["transportadora"] ?? new Set()} onFilterChange={(s) => setFilter("transportadora", s)} />
              <ColFilterTh label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "status")} selected={colFilters["status"] ?? new Set()} onFilterChange={(s) => setFilter("status", s)} />
              <ColFilterTh label="Atual" sortKey="atual" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "atual")} selected={colFilters["atual"] ?? new Set()} onFilterChange={(s) => setFilter("atual", s)} />
              <ColFilterTh label="Próx. Cliente" sortKey="proximoCliente" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "proximoCliente")} selected={colFilters["proximoCliente"] ?? new Set()} onFilterChange={(s) => setFilter("proximoCliente", s)} />
              <ColFilterTh label="Dt. Roteir." sortKey="dataRoteirizacao" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "dataRoteirizacao")} selected={colFilters["dataRoteirizacao"] ?? new Set()} onFilterChange={(s) => setFilter("dataRoteirizacao", s)} />
              <ColFilterTh label="Vol. Emb." sortKey="volumeEmbarcado" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "volumeEmbarcado")} selected={colFilters["volumeEmbarcado"] ?? new Set()} onFilterChange={(s) => setFilter("volumeEmbarcado", s)} />
              <ColFilterTh label="Pedidos" sortKey="qtdPedidos" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "qtdPedidos")} selected={colFilters["qtdPedidos"] ?? new Set()} onFilterChange={(s) => setFilter("qtdPedidos", s)} />
              <ColFilterTh label="Tarefa" sortKey="tarefaRota" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "tarefaRota")} selected={colFilters["tarefaRota"] ?? new Set()} onFilterChange={(s) => setFilter("tarefaRota", s)} />
              <ColFilterTh label="Ressalva" sortKey="temRessalva" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "temRessalva")} selected={colFilters["temRessalva"] ?? new Set()} onFilterChange={(s) => setFilter("temRessalva", s)} />
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600">Comprovante</th>
              <ColFilterTh label="Valor Total" sortKey="valorTotal" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "valorTotal")} selected={colFilters["valorTotal"] ?? new Set()} onFilterChange={(s) => setFilter("valorTotal", s)} className="" />
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
            {filtrados.map((v, index) => (
              <LinhaVeiculo
                key={v.id}
                veiculo={v}
                filtroStatus={filtroStatus}
                index={index + 1}
                onAbrirMapa={abrirMapaEmNovaAba}
              />
            ))}
            <TotalRow>
              <td />
              <td className="px-2 py-1.5 text-[11px] text-center text-gray-500">#</td>
              <td className="px-2 py-1.5 text-[11px]" colSpan={11}>{filtrados.length} de {veiculos.length} veiculos</td>
              <td className="px-2 py-1.5 text-[11px] text-center font-bold">{totalVolumesFiltrados.atual}/{totalVolumesFiltrados.total}</td>
              <td className="px-2 py-1.5 text-[11px] text-center font-bold">{filtrados.reduce((s, v) => s + v.qtdPedidos, 0)}</td>
              <td colSpan={3} />
              <td className="px-2 py-1.5 text-[11px]  font-bold">{fmt(filtrados.reduce((s, v) => s + v.valorTotal, 0), "moeda")}</td>
              <td colSpan={6} />
            </TotalRow>
          </tbody>
        </table>
      </div>
    </div>
  );
}
