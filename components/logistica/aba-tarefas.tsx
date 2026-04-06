"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { ChevronRight, ChevronDown, ChevronUp, Download, X, CameraOff, MapPin, Building2, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tarefa, Pedido, StatusPedido, ParadaTimeline } from "@/lib/mock-data";
import { PEDIDOS, VEICULOS, isPedidoParcialmenteEmbarcado } from "@/lib/mock-data";
import {
  SearchSelect, ElipsisMenu, ColFilterTh, TotalRow, IconeComprovante, ActionDropdownButton,
  StatusBadge, fmt, useSortable, useColFilters, calcularResultado,
  ValidacaoBadge, ResultadoBadge, NaoProgramadoBadge, ThValidacao,
} from "@/components/logistica/layout-components";
import { ModalComprovante } from "@/components/logistica/modal-comprovante";

// â”€â”€â”€ Modal Pedidos de uma parada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalPedidosParada({
  nomeLocal,
  pedidosParada,
  tarefa,
  onClose,
}: {
  nomeLocal: string;
  pedidosParada: Pedido[];
  tarefa: Tarefa;
  onClose: () => void;
}) {
  const CONTATOS_CLIENTE: Record<string, { endereco: string; telefone: string }> = {
    "Supermercado Bom Preço": { endereco: "Av. Central, 1200 - SP", telefone: "(11) 3333-1200" },
    "Distribuidora Alfa": { endereco: "Rua das Indústrias, 455 - SP", telefone: "(11) 3444-0455" },
    "Mini Mercado Estrela": { endereco: "Rua Estrela, 98 - SP", telefone: "(11) 3222-0098" },
    "Supermercado Família": { endereco: "Av. Família, 700 - SP", telefone: "(11) 3777-0700" },
    "Padaria Pão Quente": { endereco: "Rua do Forno, 45 - Guarulhos", telefone: "(11) 3666-0045" },
    "Restaurante Sabor & Arte": { endereco: "Av. Gourmet, 210 - Guarulhos", telefone: "(11) 3888-0210" },
    "Atacado Norte": { endereco: "Rod. Norte, Km 12 - Guarulhos", telefone: "(11) 3555-0012" },
    "Farmácia Saúde Total": { endereco: "Rua Saúde, 300 - RJ", telefone: "(21) 2444-0300" },
    "Loja Mega Eletro": { endereco: "Av. Tecnologia, 150 - RJ", telefone: "(21) 2555-0150" },
    "Distribuidora Sul": { endereco: "Av. Sul, 900 - BH", telefone: "(31) 3111-0900" },
    "Hipermercado Barato": { endereco: "Av. Econômica, 500 - BH", telefone: "(31) 3222-0500" },
  };
  const CONTATOS_EQUIPE: Record<string, string> = {
    "João Silva": "(11) 99111-2233",
    "Pedro Alves": "(11) 99222-3344",
    "Carlos Rocha": "(11) 99333-4455",
    "Marcos Lima": "(11) 99444-5566",
    "Andre Costa": "(21) 99555-6677",
    "Fábio Nunes": "(21) 99666-7788",
    "Roberto Mendes": "(31) 99777-8899",
    "Sandro Cruz": "(31) 99888-9900",
    "Rodrigo Pires": "(11) 99911-2233",
    "Wagner Souza": "(11) 99922-3344",
    "Mateus Lima": "(11) 99933-4455",
    "Igor Santos": "(11) 99944-5566",
    "Lucas Ferreira": "(11) 99955-6677",
    "Caio Ramos": "(11) 99966-7788",
  };
  const contatoCliente = CONTATOS_CLIENTE[nomeLocal] ?? { endereco: "--", telefone: "--" };
  const contatoMotorista = CONTATOS_EQUIPE[tarefa.motorista] ?? "--";
  const contatoAjudante = CONTATOS_EQUIPE[tarefa.ajudante] ?? "--";
  const veiculo = VEICULOS.find((v) => v.placa === tarefa.veiculo);
  const possuiCoordenadas = typeof veiculo?.lat === "number" && typeof veiculo?.lng === "number";
  const linkGoogleMaps = possuiCoordenadas
    ? `https://www.google.com/maps?q=${veiculo.lat},${veiculo.lng}`
    : null;
  const pedidosEntregues = pedidosParada.filter((p) => p.status === "Entregue").map((p) => p.nPedido);

  const [pedidoExpandidoId, setPedidoExpandidoId] = useState<string | null>(null);
  const [abaDetalhe, setAbaDetalhe] = useState<"volumes" | "itens" | "comprovantes" | "ressalvas">("volumes");
  const [modalComp, setModalComp] = useState<{ comprovantes: Pedido["comprovantes"]; indice: number; pedidoNum: string } | null>(null);
  const comprovanteRessalva = (pedido: Pedido, r: Pedido["ressalvas"][number]): Pedido["comprovantes"] => [
    {
      id: `RES-COMP-${pedido.id}-${r.id}`,
      tipo: "Foto Ressalva",
      arquivo: r.arquivoFoto ?? `foto_ressalva_${pedido.nPedido}_${r.id}.jpg`,
      dataHora: r.dataHora,
      usuario: r.usuario,
    },
  ];
  const entregues = pedidosParada.filter((p) => p.status === "Entregue").length;
  const pendentes = pedidosParada.filter((p) => p.status !== "Entregue" && p.status !== "Com Ressalvas").length;
  const comRessalva = pedidosParada.filter((p) => p.tipoRessalva !== null || p.ressalvas.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-[920px] max-w-[95vw] max-h-[80vh] overflow-hidden flex flex-col">
        {modalComp && (
          <ModalComprovante
            comprovantes={modalComp.comprovantes}
            indiceInicial={modalComp.indice}
            pedidoNum={modalComp.pedidoNum}
            onClose={() => setModalComp(null)}
          />
        )}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a3c6e] text-white">
          <div>
            <h2 className="text-sm font-semibold">Pedidos do Local</h2>
            <p className="text-blue-200 text-xs">{nomeLocal}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white"><X size={18} /></button>
        </div>
        {/* Resumo */}
        <div className="flex gap-4 px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Total</p>
            <p className="text-lg font-bold text-gray-800">{pedidosParada.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Entregues</p>
            <p className="text-lg font-bold text-green-600">{entregues}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Pendentes</p>
            <p className="text-lg font-bold text-orange-500">{pendentes}</p>
          </div>
          {comRessalva > 0 && (
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase">Com Ressalva</p>
              <p className="text-lg font-bold text-red-600">{comRessalva}</p>
            </div>
          )}
        </div>
        {/* Detalhes da tarefa/local */}
        <div className="px-5 py-3 border-b border-gray-200 bg-white">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Detalhes da Tarefa</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <div><span className="text-gray-500">Nome do Cliente:</span> <span className="font-medium text-gray-800">{nomeLocal}</span></div>
            <div><span className="text-gray-500">Tarefa:</span> <span className="font-medium text-gray-800">{tarefa.idTarefa}</span></div>
            <div><span className="text-gray-500">Endereço:</span> <span className="font-medium text-gray-800">{contatoCliente.endereco}</span></div>
            <div><span className="text-gray-500">Veículo:</span> <span className="font-medium text-gray-800">{tarefa.veiculo}</span></div>
            <div><span className="text-gray-500">Telefone:</span> <span className="font-medium text-gray-800">{contatoCliente.telefone}</span></div>
            <div className="flex items-center gap-1.5"><span className="text-gray-500">Status:</span> <StatusBadge status={tarefa.status} /></div>
            <div><span className="text-gray-500">Responsável:</span> <span className="font-medium text-gray-800">{tarefa.motorista}</span></div>
            <div><span className="text-gray-500">Ajudante:</span> <span className="font-medium text-gray-800">{tarefa.ajudante}</span></div>
            <div><span className="text-gray-500">Contato Motorista:</span> <span className="font-medium text-gray-800">{contatoMotorista}</span></div>
            <div><span className="text-gray-500">Contato Ajudante:</span> <span className="font-medium text-gray-800">{contatoAjudante}</span></div>
            <div className="col-span-2">
              <span className="text-gray-500">Pedidos Entregues:</span>{" "}
              <span className="font-medium text-gray-800">{pedidosEntregues.length > 0 ? pedidosEntregues.join(", ") : "--"}</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 pt-1 text-gray-600">
              <MapPin size={12} className="text-blue-600" />
              <span className="text-gray-500">Localização</span>
            </div>
            <div><span className="text-gray-500">Latitude:</span> <span className="font-medium text-gray-800">{veiculo ? veiculo.lat : "--"}</span></div>
            <div><span className="text-gray-500">Longitude:</span> <span className="font-medium text-gray-800">{veiculo ? veiculo.lng : "--"}</span></div>
            {linkGoogleMaps && (
              <div className="col-span-2 pt-1">
                <a
                  href={linkGoogleMaps}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-blue-600 underline hover:text-blue-800"
                >
                  Abrir no Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-y-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-7" />
                {["Nº Pedido", "Remessa", "Status", "Vol.", "Peso", "Cubagem", "Valor", "Ressalva"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosParada.map((p) => (
                <Fragment key={p.id}>
                  <tr
                    onClick={() => {
                      setPedidoExpandidoId((prev) => (prev === p.id ? null : p.id));
                      setAbaDetalhe("volumes");
                    }}
                    className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${pedidoExpandidoId === p.id ? "bg-blue-50" : ""}`}
                  >
                    <td className="pl-3 pr-1 py-2 w-7">
                      <button className="text-gray-400 hover:text-blue-600">
                        {pedidoExpandidoId === p.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-blue-700 font-semibold">{p.nPedido}</td>
                    <td className="px-3 py-2 text-gray-500">{p.nRemessa}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-2 text-center">{`${p.qtdVolumes}/${p.qtdVolumesTotal}`}</td>
                    <td className="px-3 py-2">{fmt(p.peso, "peso")}</td>
                    <td className="px-3 py-2">{fmt(p.cubagem, "cubagem")}</td>
                    <td className="px-3 py-2  font-medium">{fmt(p.valorTotal, "moeda")}</td>
                    <td className="px-3 py-2">
                      {p.tipoRessalva ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.tipoRessalva === "No Pedido" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                          {p.tipoRessalva}
                        </span>
                      ) : <span className="text-gray-300">--</span>}
                    </td>
                  </tr>
                  {pedidoExpandidoId === p.id && (
                    <tr>
                      <td colSpan={9} className="px-5 pb-3 bg-blue-50/30">
                        <div className="border border-blue-200 rounded-md bg-white">
                          <div className="flex border-b border-blue-200 bg-blue-50">
                            {(["volumes", "itens", "comprovantes", "ressalvas"] as const).map((a) => (
                              <button
                                key={a}
                                onClick={(e) => { e.stopPropagation(); setAbaDetalhe(a); }}
                                className={`px-4 py-1.5 text-[11px] font-medium capitalize transition-colors border-r border-blue-200 last:border-r-0 ${
                                  abaDetalhe === a ? "bg-white text-blue-700 border-b border-b-white -mb-px" : "text-gray-600 hover:bg-blue-100"
                                }`}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                          {abaDetalhe === "volumes" && (
                            <table className="w-full text-[11px]">
                              <thead className="bg-gray-50">
                                <tr>
                                  {["Nº Volume", "Tarefa/Retirada", "Hr Embarque", "Hr Desembarque", "Hr Entrega", "Rota"].map((h) => (
                                    <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {p.volumes.map((v) => (
                                  <tr key={v.id} className="border-t border-gray-100">
                                    <td className="px-3 py-1.5 font-mono text-[10px]">{v.nVolume}</td>
                                    <td className="px-3 py-1.5">{v.tarefaRetirada}</td>
                                    <td className="px-3 py-1.5">{v.horaEmbarque || "--"}</td>
                                    <td className="px-3 py-1.5">{v.horaDesembarque || "--"}</td>
                                    <td className="px-3 py-1.5">{v.horaEntrega || "--"}</td>
                                    <td className="px-3 py-1.5">{v.rota || "--"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {abaDetalhe === "itens" && (
                            <div>
                              {p.itens.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 px-3 py-1.5 border-t border-gray-100 text-[11px]">
                                  <span className="font-medium">{item.nomeProduto}</span>
                                  <span className="text-gray-400">Qtd: {item.qtdEntregue}/{item.qtdSolicitada}</span>
                                  <span className="text-gray-400">{fmt(item.valorTotal, "moeda")}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {abaDetalhe === "comprovantes" && (
                            p.comprovantes.length === 0 ? (
                              <p className="px-3 py-4 text-xs text-gray-400 text-center">Nenhum comprovante</p>
                            ) : p.comprovantes.map((c, idx) => (
                              <div key={c.id} className="flex items-center gap-3 px-3 py-1.5 border-t border-gray-100 text-[11px]">
                                <span>{c.tipo}</span>
                                <span
                                  className="text-blue-600 underline cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalComp({ comprovantes: p.comprovantes, indice: idx, pedidoNum: p.nPedido });
                                  }}
                                >
                                  {c.arquivo}
                                </span>
                                <span className="text-gray-400">{c.dataHora}</span>
                              </div>
                            ))
                          )}
                          {abaDetalhe === "ressalvas" && (
                            p.ressalvas.length === 0 ? (
                              <p className="px-3 py-4 text-xs text-gray-400 text-center">Nenhuma ressalva</p>
                            ) : (
                              <table className="w-full text-[11px]">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {["Tipo", "Descrição", "Data/Hora", "Usuário", "Status", "FOTO"].map((h) => (
                                      <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.ressalvas.map((r) => (
                                    <tr key={r.id} className="border-t border-gray-100">
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
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setModalComp({ comprovantes: comprovanteRessalva(p, r), indice: 0, pedidoNum: p.nPedido });
                                            }}
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
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Timeline horizontal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildTimelineBase(tarefa: Tarefa): ParadaTimeline[] {
  const timelineBase = tarefa.timeline.length > 0
    ? tarefa.timeline.map((p) => ({ ...p }))
    : (() => {
        if (!tarefa.roteirizado) return [];
        const clientes = Array.from(new Set(
          PEDIDOS.filter((p) => tarefa.listaPedidos.includes(p.nPedido)).map((p) => p.cliente)
        ));
        return [
          { nome: `Galpão ${tarefa.operacao}`, tipo: "galpao", entrada: "", saida: "", permanencia: "planejado" },
          ...clientes.map((c) => ({ nome: c, tipo: "cliente", entrada: "", saida: "", permanencia: "planejado" })),
        ] satisfies ParadaTimeline[];
      })();

  if (timelineBase.length === 0) return [];

  const nomeGalpao = timelineBase.find((p) => p.tipo === "galpao")?.nome || `Galpão ${tarefa.operacao}`;

  if (timelineBase[0]?.tipo !== "galpao") {
    timelineBase.unshift({
      nome: nomeGalpao,
      tipo: "galpao",
      entrada: "",
      saida: tarefa.inicio || "",
      permanencia: "planejado",
    });
  }

  const ultimaParada = timelineBase[timelineBase.length - 1];
  if (ultimaParada?.tipo !== "galpao") {
    timelineBase.push({
      nome: nomeGalpao,
      tipo: "galpao",
      entrada: tarefa.termino || "",
      saida: "",
      permanencia: "retorno",
    });
  } else if (!ultimaParada.entrada && tarefa.termino) {
    ultimaParada.entrada = tarefa.termino;
  }

  return timelineBase;
}

// Componente para renderizar tooltip do dot em portal (sempre à frente)
function DotTooltip({ text }: { text: string }) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!dotRef.current || !mounted) return;

    const updatePosition = () => {
      if (dotRef.current) {
        const rect = dotRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY + 10,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }
    };

    const handleMouseEnter = () => updatePosition();
    const handleMouseLeave = () => setPosition(null);

    const dot = dotRef.current;
    dot.addEventListener("mouseenter", handleMouseEnter);
    dot.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      dot.removeEventListener("mouseenter", handleMouseEnter);
      dot.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <div ref={dotRef} className="w-6 h-6 rounded-full border-2 flex items-center justify-center relative" />
      {position &&
        ReactDOM.createPortal(
          <div
            className="fixed bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[999999] pointer-events-none"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

function TimelineTarefa({ tarefa }: { tarefa: Tarefa }) {
  const [paradaModal, setParadaModal] = useState<{ nome: string; pedidos: Pedido[]; tarefa: Tarefa } | null>(null);
  const [dotHover, setDotHover] = useState<number | null>(null);
  const [dotPosition, setDotPosition] = useState<{ top: number; left: number } | null>(null);
  const [dotTooltipText, setDotTooltipText] = useState("");
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dataBase = tarefa.dataRoteirizacao?.split(" ")[0] || "";
  const comData = (valor: string) => {
    if (!valor) return "--";
    if (valor.includes("/")) return valor;
    return dataBase ? `${dataBase} ${valor}` : valor;
  };

  const timelineGerada = buildTimelineBase(tarefa);

  if (timelineGerada.length === 0) {
    return <p className="py-6 text-center text-xs text-gray-400">Nenhum dado de timeline disponível.</p>;
  }

  return (
    <div className="p-5 overflow-x-auto overflow-y-visible">
      {/* Linha do tempo horizontal */}
      <div className="flex items-start gap-0 min-w-max overflow-visible">
        {timelineGerada.map((parada, i) => {
          const isGalpaoInicio = i === 0;
          const isGalpaoFim = i === timelineGerada.length - 1;
          const isGalpao = isGalpaoInicio || isGalpaoFim;
          const isUltimo = i === timelineGerada.length - 1;

          // Pedidos associados a esta parada (por nome do cliente)
          const pedidosParada = PEDIDOS.filter((p) =>
            tarefa.listaPedidos.includes(p.nPedido) && p.cliente === parada.nome
          );
          const qtdEntregues = pedidosParada.filter((p) => p.status === "Entregue").length;
          const volAtual = pedidosParada.reduce((s, p) => s + p.qtdVolumes, 0);
          const volTotal = pedidosParada.reduce((s, p) => s + p.qtdVolumesTotal, 0);
          const totalPedidosParada = pedidosParada.length;
          const qtdNaoEntregues = pedidosParada.filter((p) => p.status !== "Entregue" && p.status !== "Com Ressalvas").length;
          const saiuDoLocal = Boolean(parada.saida);
          const isEntregue = pedidosParada.length > 0 && qtdEntregues === pedidosParada.length;
          const embarqueIncompleto = volTotal > 0 && volAtual < volTotal;
          const precisaAtencao = !isGalpao && saiuDoLocal && (qtdNaoEntregues > 0 || embarqueIncompleto);
          const nivelRessalva = pedidosParada.reduce<"nenhuma" | "item" | "pedido">((nivel, p) => {
            if (p.tipoRessalva === "No Pedido") return "pedido";
            if (p.tipoRessalva === "No Item" && nivel !== "pedido") return "item";
            return nivel;
          }, "nenhuma");
          const temRessalvaNoPedido = nivelRessalva === "pedido";
          const temRessalvaNoItem = nivelRessalva === "item";
          const parcialmenteEntregue = !isEntregue && volTotal > 0 && volAtual > 0 && volAtual < volTotal;
          const entregueSemComprovante = pedidosParada.some((p) => p.status === "Entregue" && !p.comComprovante);
          const ressalvaSemFoto = pedidosParada.some(
            (p) =>
              (p.tipoRessalva !== null || p.ressalvas.length > 0) &&
              (p.ressalvas.length === 0 || p.ressalvas.some((r) => !r.temFoto))
          );

          const dotColor = isGalpao
            ? "bg-[#1a3c6e] border-[#1a3c6e]"
            : temRessalvaNoPedido
              ? "bg-red-500 border-red-500"
              : temRessalvaNoItem
                ? "bg-orange-500 border-orange-500"
                : parcialmenteEntregue
                  ? "bg-yellow-500 border-yellow-500"
            : isEntregue
              ? "bg-green-500 border-green-500"
              : precisaAtencao
                ? "bg-orange-500 border-orange-500"
                : "bg-gray-400 border-gray-400";

          const cardBg = isGalpao
            ? "bg-[#1a3c6e]/5 border-[#1a3c6e]/20"
            : temRessalvaNoPedido
              ? "bg-red-50 border-red-300 hover:border-red-400 hover:shadow-sm"
              : temRessalvaNoItem
                ? "bg-orange-50 border-orange-300 hover:border-orange-400 hover:shadow-sm"
                : parcialmenteEntregue
                  ? "bg-yellow-50 border-yellow-300 hover:border-yellow-400 hover:shadow-sm"
            : isEntregue
              ? "bg-white border-green-200 hover:border-green-300 hover:shadow-sm"
              : precisaAtencao
                ? "bg-orange-50 border-orange-300 hover:border-orange-400 hover:shadow-sm"
                : "bg-gray-50 border-gray-300 hover:border-gray-400 hover:shadow-sm";
          const dotTooltip = isGalpao
            ? "Centro de distribuição"
            : temRessalvaNoPedido
              ? "Entregue com ressalva no pedido"
              : temRessalvaNoItem
                ? "Entregue com ressalva no item"
                : parcialmenteEntregue
                  ? "Pedido parcialmente entregue"
                  : isEntregue
                    ? "Entregue normalmente"
                    : precisaAtencao
                      ? "Atenção: saída com pendência"
                      : "Pedido pendente";

          return (
            <div key={i} className="flex items-start">
              {/* Parada */}
              <div className="flex flex-col items-center w-52">
                {/* Ponto + linha acima */}
                <div className="flex items-center w-full mb-3">
                  {/* Linha esquerda */}
                  {i > 0 ? (
                    <div className="flex-1 h-0.5 bg-gray-300" />
                  ) : (
                    <div className="flex-1" />
                  )}
                  {/* Círculo */}
                  <div
                    className="relative flex-shrink-0"
                    ref={(el) => {
                      dotRefs.current[i] = el;
                    }}
                    onMouseEnter={() => {
                      if (dotRefs.current[i]) {
                        const rect = dotRefs.current[i]!.getBoundingClientRect();
                        setDotHover(i);
                        setDotTooltipText(dotTooltip);
                        setDotPosition({
                          top: rect.top + window.scrollY + 10,
                          left: rect.left + window.scrollX + rect.width / 2,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setDotHover(null);
                      setDotPosition(null);
                      setDotTooltipText("");
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 ${dotColor} flex items-center justify-center`}>
                      {isGalpao ? (
                        <Warehouse size={13} className="text-white" />
                      ) : (
                        <Building2 size={13} className="text-white" />
                      )}
                    </div>
                  </div>
                  {/* Linha direita */}
                  {!isUltimo ? (
                    <div className="flex-1 h-0.5 bg-gray-300" />
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>

                {/* Card da parada */}
                <div
                  className={`w-48 border rounded-lg p-3 transition-all ${cardBg} ${!isGalpao ? "cursor-pointer" : ""} ${isGalpao ? "relative group" : ""}`}
                  onClick={() => {
                    if (!isGalpao && pedidosParada.length > 0) {
                      setParadaModal({ nome: parada.nome, pedidos: pedidosParada, tarefa });
                    }
                  }}
                >
                  {isGalpaoInicio && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-[9999]">
                      <div className="bg-gray-800 text-white text-[10px] px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap text-center">
                        <div className="font-semibold">Saída do centro de distribuição</div>
                        <div className="text-gray-300">{comData(parada.saida || tarefa.inicio || "")}</div>
                      </div>
                    </div>
                  )}
                  {isGalpaoFim && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-[9999]">
                      <div className="bg-gray-800 text-white text-[10px] px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap text-center">
                        <div className="font-semibold">Chegada no centro de distribuição</div>
                        <div className="text-gray-300">{comData(parada.entrada || "")}</div>
                      </div>
                    </div>
                  )}
                  {/* Tipo badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      isGalpaoInicio ? "bg-blue-100 text-blue-700" :
                      isGalpaoFim ? "bg-slate-100 text-slate-600" :
                      temRessalvaNoPedido ? "bg-red-100 text-red-700" :
                      temRessalvaNoItem ? "bg-orange-100 text-orange-700" :
                      parcialmenteEntregue ? "bg-yellow-100 text-yellow-700" :
                      isEntregue ? "bg-green-100 text-green-700" :
                      precisaAtencao ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {isGalpaoInicio ? "Início" : isGalpaoFim ? "Fim" : "Cliente"}
                    </span>
                    {!isGalpao && pedidosParada.length > 0 && (
                      <span className="text-[9px] text-blue-600 underline cursor-pointer font-medium">
                        ver pedidos
                      </span>
                    )}
                  </div>

                  {/* Nome */}
                  <p className="text-[11px] font-semibold text-gray-800 leading-tight mb-2">{parada.nome}</p>

                  {/* Dados de tempo */}
                  {isGalpaoInicio ? (
                    <div className="text-[10px] text-gray-600">
                      <span className="font-medium text-gray-700">Saída:</span> {parada.saida || tarefa.inicio || "--"}
                    </div>
                  ) : isGalpaoFim ? (
                    <div className="text-[10px] text-gray-600">
                      <span className="font-medium text-gray-700">Chegada:</span> {parada.entrada || "--"}
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-[10px] text-gray-600">
                      <div><span className="font-medium text-gray-700">Entrada:</span> {parada.entrada || "--"}</div>
                      <div><span className="font-medium text-gray-700">Saída:</span> {parada.saida || "--"}</div>
                      <div><span className="font-medium text-gray-700">Permanência:</span> {parada.permanencia}</div>
                      <div><span className="font-medium text-gray-700">Vol. Emb.:</span> {`${volAtual}/${volTotal}`}</div>
                      {totalPedidosParada > 1 && (
                        <div><span className="font-medium text-gray-700">Pedidos Entregues:</span> {`${qtdEntregues}/${totalPedidosParada}`}</div>
                      )}
                      {(entregueSemComprovante || ressalvaSemFoto) && (
                        <div className="flex items-center gap-2 pt-0.5">
                          {entregueSemComprovante && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700" title="Pedido entregue sem comprovante">
                              <CameraOff size={12} />
                              Sem comprovante
                            </span>
                          )}
                          {ressalvaSemFoto && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-700" title="Ressalva registrada sem foto/comprovante">
                              <CameraOff size={12} />
                              Ressalva sem foto
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pedidos resumo */}
                  {!isGalpao && pedidosParada.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">{pedidosParada.length} pedido(s)</span>
                      <span className="text-[10px] text-green-600 font-medium">{qtdEntregues} entregue(s)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Conector entre paradas (seta) */}
              {!isUltimo && (
                <div className="flex items-center mt-[22px] -mx-2">
                  <svg width="16" height="12" viewBox="0 0 16 12" className="text-gray-400 flex-shrink-0">
                    <path d="M0 6 L10 6 M7 2 L14 6 L7 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de pedidos da parada */}
      {paradaModal && (
        <ModalPedidosParada
          nomeLocal={paradaModal.nome}
          pedidosParada={paradaModal.pedidos}
          tarefa={paradaModal.tarefa}
          onClose={() => setParadaModal(null)}
        />
      )}

      {/* Portal para tooltip do dot - renderizado em document.body para não ser cortado */}
      {dotHover !== null &&
        dotPosition &&
        ReactDOM.createPortal(
          <div
            className="fixed bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[999999] pointer-events-none"
            style={{
              top: `${dotPosition.top}px`,
              left: `${dotPosition.left}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            {dotTooltipText}
          </div>,
          document.body
        )}
    </div>
  );
}

// â”€â”€â”€ Deslocamento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DeslocamentoTarefa({ tarefa }: { tarefa: Tarefa }) {
  if (tarefa.deslocamentos.length === 0) {
    return <p className="py-6 text-center text-xs text-gray-400">Nenhum deslocamento registrado.</p>;
  }
  const totalInformado = tarefa.deslocamentos.reduce((s, d) => s + d.kmInformado, 0);
  const totalEstimado = tarefa.deslocamentos.reduce((s, d) => s + d.kmEstimado, 0);
  const totalDif = totalInformado - totalEstimado;

  function difClass(dif: number) {
    if (dif === 0) return "text-green-700 bg-green-50";
    if (Math.abs(dif) <= 3) return "text-yellow-700 bg-yellow-50";
    return "text-red-700 bg-red-50";
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead className="bg-gray-50">
          <tr>
            {["Ordem","Origem","Destino","Hr. Inicial","Hr. Final","KM Inicial","KM Final","KM Informado","KM Estimado","Diferença KM","Status"].map((h) => (
              <th key={h} className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tarefa.deslocamentos.map((d) => {
            const dif = d.kmInformado > 0 ? d.diferencaKm : 0;
            return (
              <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-1.5 text-center font-medium">{d.ordem}</td>
                <td className="px-2 py-1.5">{d.origem}</td>
                <td className="px-2 py-1.5">{d.destino}</td>
                <td className="px-2 py-1.5">{d.horarioInicial}</td>
                <td className="px-2 py-1.5">{d.horarioFinal || "--"}</td>
                <td className="px-2 py-1.5  font-mono">{d.kmInicial.toLocaleString()}</td>
                <td className="px-2 py-1.5  font-mono">{d.kmFinal > 0 ? d.kmFinal.toLocaleString() : "--"}</td>
                <td className="px-2 py-1.5  font-medium">{d.kmInformado > 0 ? `${d.kmInformado} km` : "--"}</td>
                <td className="px-2 py-1.5  text-blue-700">{d.kmEstimado} km</td>
                <td className="px-2 py-1.5 ">
                  {d.kmInformado > 0 ? (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${difClass(dif)}`}>
                      {dif > 0 ? `+${dif}` : dif} km
                    </span>
                  ) : "--"}
                </td>
                <td className="px-2 py-1.5">
                  {d.kmInformado > 0 ? (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${difClass(dif)}`}>
                      {Math.abs(dif) === 0 ? "Normal" : Math.abs(dif) <= 3 ? "Atenção" : "Divergência"}
                    </span>
                  ) : <span className="text-gray-400 text-[10px]">Aguardando</span>}
                </td>
              </tr>
            );
          })}
          <TotalRow>
            <td className="px-2 py-1.5 text-[10px] text-gray-500 uppercase" colSpan={7}>Total</td>
            <td className="px-2 py-1.5  text-[11px]">{totalInformado} km</td>
            <td className="px-2 py-1.5  text-[11px] text-blue-700">{totalEstimado} km</td>
            <td className="px-2 py-1.5  text-[11px]">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${totalDif > 0 ? "text-yellow-700 bg-yellow-50" : totalDif < 0 ? "text-blue-700 bg-blue-50" : "text-green-700 bg-green-50"}`}>
                {totalDif > 0 ? `+${totalDif}` : totalDif} km
              </span>
            </td>
            <td />
          </TotalRow>
        </tbody>
      </table>
    </div>
  );
}

// â”€â”€â”€ Pausa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PausaTarefa({ tarefa }: { tarefa: Tarefa }) {
  if (tarefa.pausas.length === 0) {
    return <p className="py-6 text-center text-xs text-gray-400">Nenhuma pausa registrada.</p>;
  }
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-gray-50">
        <tr>
          {["Motivo","Observação","Início","Fim"].map((h) => (
            <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tarefa.pausas.map((p) => (
          <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
            <td className="px-3 py-1.5">{p.motivo}</td>
            <td className="px-3 py-1.5 text-gray-500">{p.observacao}</td>
            <td className="px-3 py-1.5">{p.inicio}</td>
            <td className="px-3 py-1.5">{p.fim}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// â”€â”€â”€ Pedágio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ï¿½ï¿½ï¿½â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PedagioTarefa({ tarefa }: { tarefa: Tarefa }) {
  if (tarefa.pedagios.length === 0) {
    return <p className="py-6 text-center text-xs text-gray-400">Nenhum pedágio registrado.</p>;
  }
  const total = tarefa.pedagios.reduce((s, p) => s + p.valor, 0);
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-gray-50">
        <tr>
          {["Concessionária","Endereço","Data/Hora","Valor"].map((h) => (
            <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tarefa.pedagios.map((p) => (
          <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
            <td className="px-3 py-1.5">{p.concessionaria}</td>
            <td className="px-3 py-1.5">{p.endereco}</td>
            <td className="px-3 py-1.5">{p.dataHora}</td>
            <td className="px-3 py-1.5  font-medium">{fmt(p.valor, "moeda")}</td>
          </tr>
        ))}
        <TotalRow>
          <td className="px-3 py-1.5 text-[10px] text-gray-500 uppercase" colSpan={3}>Total</td>
          <td className="px-3 py-1.5  text-[11px]">{fmt(total, "moeda")}</td>
        </TotalRow>
      </tbody>
    </table>
  );
}

// â”€â”€â”€ Modal Pedido vindo de tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalPedidoTarefa({ pedido, onClose }: { pedido: Pedido; onClose: () => void }) {
  const [aba, setAba] = useState<"itens" | "comprovantes" | "ressalvas">("itens");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        {modalComp && (
          <ModalComprovante
            comprovantes={modalComp.comprovantes}
            indiceInicial={modalComp.indice}
            pedidoNum={pedido.nPedido}
            onClose={() => setModalComp(null)}
          />
        )}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a3c6e] text-white">
          <div>
            <h2 className="text-sm font-semibold">Detalhes do Pedido</h2>
            <p className="text-blue-200 text-xs">{pedido.nPedido} -- {pedido.cliente}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-4">
          {/* Dados principais */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              ["Pedido", pedido.nPedido], ["Remessa", pedido.nRemessa], ["Status", pedido.status],
              ["Cliente", pedido.cliente], ["Operação", pedido.operacao], ["Prioridade", pedido.prioridade],
              ["Placa", pedido.placa], ["Motorista", pedido.motorista], ["Valor", fmt(pedido.valorTotal, "moeda")],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded p-2">
                <p className="text-[10px] text-gray-500 uppercase">{k}</p>
                <p className="text-xs font-medium text-gray-800">{v as string}</p>
              </div>
            ))}
          </div>
          {/* Volumes */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-1.5 uppercase">Volumes</h3>
            <table className="w-full text-[11px] border border-gray-200 rounded">
              <thead className="bg-gray-50">
                <tr>
                  {["Nº Volume","Índice","Hr Embarque","Hr Desembarque","Hr Entrega","Tarefa/Retirada"].map((h) => (
                    <th key={h} className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedido.volumes.map((v) => (
                  <tr key={v.id} className="border-t border-gray-100">
                    <td className="px-2 py-1.5 font-mono text-[10px]">{v.nVolume}</td>
                    <td className="px-2 py-1.5">{v.tarefaRetirada}</td>
                    <td className="px-2 py-1.5 text-center">{v.nVolume}</td>
                    <td className="px-2 py-1.5">{v.horaEmbarque}</td>
                    <td className="px-2 py-1.5">{v.horaDesembarque}</td>
                    <td className="px-2 py-1.5">{v.horaEntrega}</td>
                    <td className="px-2 py-1.5">{v.rota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Abas */}
          <div className="border border-gray-200 rounded">
            <div className="flex border-b border-gray-200 bg-gray-50">
              {(["itens","comprovantes","ressalvas"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAba(a)}
                  className={`px-4 py-1.5 text-[11px] font-medium capitalize transition-colors border-r border-gray-200 last:border-r-0 ${aba === a ? "bg-white text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
            <div className="bg-white">
              {aba === "itens" && pedido.itens.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-100 text-[11px]">
                  <span className="font-medium">{item.nomeProduto}</span>
                  <span className="text-gray-400">Qtd: {item.qtdEntregue}/{item.qtdSolicitada}</span>
                  <span className="text-gray-400">{fmt(item.valorTotal, "moeda")}</span>
                </div>
              ))}
              {aba === "comprovantes" && (pedido.comprovantes.length === 0 ? (
                <p className="px-3 py-4 text-xs text-gray-400 text-center">Nenhum comprovante</p>
              ) : pedido.comprovantes.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-100 text-[11px]">
                  <span>{c.tipo}</span>
                  <span
                    className="text-blue-600 underline cursor-pointer"
                    onClick={() => setModalComp({ comprovantes: pedido.comprovantes, indice: idx })}
                  >
                    {c.arquivo}
                  </span>
                  <span className="text-gray-400">{c.dataHora}</span>
                </div>
              )))}
              {aba === "ressalvas" && (pedido.ressalvas.length === 0 ? (
                <p className="px-3 py-4 text-xs text-gray-400 text-center">Nenhuma ressalva</p>
              ) : (
                <table className="w-full text-[11px]">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Tipo", "Descrição", "Data/Hora", "Usuário", "Status", "FOTO"].map((h) => (
                        <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.ressalvas.map((r) => (
                      <tr key={r.id} className="border-t border-gray-100">
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Tooltip pedidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TooltipPedidos({ tarefa }: { tarefa: Tarefa }) {
  const [open, setOpen] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [pedidoModal, setPedidoModal] = useState<Pedido | null>(null);
  const pedidosDaTarefa = tarefa.listaPedidos.map((nPed) => ({
    nPed,
    pedido: PEDIDOS.find((p) => p.nPedido === nPed) ?? null,
  }));
  const pedidosVisiveis = mostrarTodos ? pedidosDaTarefa : pedidosDaTarefa.slice(0, 3);

  function abrirTooltip() {
    setOpen(true);
    setMostrarTodos(false);
  }

  function fecharTooltip() {
    setOpen(false);
    setMostrarTodos(false);
  }

  return (
    <div className="relative inline-block" onMouseEnter={abrirTooltip} onMouseLeave={fecharTooltip}>
      <button
        className="text-blue-700 font-semibold underline hover:text-blue-900 text-[11px]"
        onClick={(e) => { e.stopPropagation(); abrirTooltip(); }}
      >
        N° Pedidos
      </button>
      {open && (
        <>
          <div
            className="absolute left-0 z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg w-[420px] max-w-[90vw]"
          >
            <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase border-b border-gray-100">Pedidos da Tarefa</p>
            <div className="grid grid-cols-3 gap-2 p-2">
              {pedidosVisiveis.map(({ nPed, pedido }) => (
                <button
                  key={nPed}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pedido) setPedidoModal(pedido);
                    fecharTooltip();
                  }}
                  className="text-left rounded border border-gray-200 px-2 py-2 text-xs hover:bg-blue-50"
                >
                  <span className="block font-semibold text-blue-700 truncate">{nPed}</span>
                </button>
              ))}
            </div>
            {!mostrarTodos && pedidosDaTarefa.length > 3 && (
              <div className="px-2 pb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMostrarTodos(true);
                  }}
                  className="w-full rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                >
                  Ver mais ({pedidosDaTarefa.length - 3})
                </button>
              </div>
            )}
          </div>
        </>
      )}
      {pedidoModal && (
        <ModalPedidoTarefa pedido={pedidoModal} onClose={() => setPedidoModal(null)} />
      )}
    </div>
  );
}

function ModalOrdemEntrega({
  clientesIniciais,
  onClose,
  onSave,
}: {
  clientesIniciais: string[];
  onClose: () => void;
  onSave: (clientes: string[]) => void;
}) {
  const [clientes, setClientes] = useState<string[]>(clientesIniciais);

  function mover(idx: number, dir: -1 | 1) {
    const novo = [...clientes];
    const alvo = idx + dir;
    if (alvo < 0 || alvo >= novo.length) return;
    const tmp = novo[idx];
    novo[idx] = novo[alvo];
    novo[alvo] = tmp;
    setClientes(novo);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a3c6e] text-white">
          <div>
            <h2 className="text-sm font-semibold">Alterar Ordem de Entrega</h2>
            <p className="text-blue-200 text-xs">Reordene os clientes da rota</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto">
          {clientes.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Nenhum cliente na rota.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {clientes.map((c, idx) => (
                <div key={`${c}-${idx}`} className="flex items-center justify-between border border-gray-200 rounded px-3 py-2">
                  <span className="text-[11px] font-medium text-gray-700">{idx + 1}. {c}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => mover(idx, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                      disabled={idx === 0}
                      title="Mover para cima"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => mover(idx, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                      disabled={idx === clientes.length - 1}
                      title="Mover para baixo"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button size="sm" className="bg-[#1a3c6e] hover:bg-[#15305a] text-white" onClick={() => onSave(clientes)}>
            Salvar ordem
          </Button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Linha de Tarefa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LinhaTarefa({ tarefa, onAlterarOrdem }: { tarefa: Tarefa; onAlterarOrdem: (t: Tarefa) => void }) {
  const [expandido, setExpandido] = useState(false);
  const [aba, setAba] = useState<"visao" | "deslocamento" | "pausa" | "pedagio">("visao");
  const pedidosTarefa = PEDIDOS.filter((p) => tarefa.listaPedidos.includes(p.nPedido));
  const tipoRessalvaTarefa: "No Pedido" | "No Item" | null = pedidosTarefa.some((p) => p.tipoRessalva === "No Pedido")
    ? "No Pedido"
    : pedidosTarefa.some((p) => p.tipoRessalva === "No Item")
      ? "No Item"
      : null;
  const ressalvaSemFotoTarefa = pedidosTarefa.some(
    (p) => p.tipoRessalva !== null && (p.ressalvas.length === 0 || p.ressalvas.some((r) => !r.temFoto))
  );
  const semComprovanteTarefa = pedidosTarefa.some((p) => !p.comComprovante);

  return (
    <>
      <tr
        onClick={() => setExpandido(!expandido)}
        className={`border-t border-gray-100 cursor-pointer transition-colors ${expandido ? "bg-amber-50/60" : "hover:bg-gray-50"}`}
      >
        <td className="pl-3 pr-1 py-2 w-7">
          <button className="text-gray-400 hover:text-amber-600">
            {expandido ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </td>
        <td className="px-2 py-2 text-[11px] text-center">{tarefa.ordem}</td>
        <td className="px-2 py-2 text-[11px] font-mono text-blue-700 font-medium">{tarefa.idTarefa}</td>
        <td className="px-2 py-2 text-[11px]">{tarefa.operacao}</td>
        <td className="px-2 py-2 text-[11px] font-mono">{tarefa.veiculo}</td>
        <td className="px-2 py-2 text-[11px]">{tarefa.motorista}</td>
        <td className="px-2 py-2 text-[11px]">{tarefa.ajudante}</td>
        <td className="px-2 py-2 text-[11px] text-center">{tarefa.dataRoteirizacao || "--"}</td>
        <td className="px-2 py-2"><StatusBadge status={tarefa.status} /></td>
        <td className="px-2 py-2 text-[11px] text-center">{tarefa.inicioPrevisto}</td>
        <td className="px-2 py-2 text-[11px] text-center">{tarefa.inicio || "--"}</td>
        <td className="px-2 py-2 text-[11px] text-center">{tarefa.termino || "--"}</td>
        <td className="px-2 py-2 text-[11px]">{tarefa.atual}</td>
        <td className="px-2 py-2 text-[11px]">{tarefa.proximoCliente}</td>
        <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
          <TooltipPedidos tarefa={tarefa} />
        </td>
        <td className="px-2 py-2 text-[11px] text-center font-medium">{tarefa.qtdVolumes}</td>
        <td className="px-2 py-2 text-[11px] text-center">
          {tipoRessalvaTarefa ? (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${tipoRessalvaTarefa === "No Pedido" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
              {tipoRessalvaTarefa}
              {ressalvaSemFotoTarefa && (
                <>
                  <span>-</span>
                  <CameraOff size={12} />
                </>
              )}
            </span>
          ) : <span className="text-gray-300 text-[10px]">--</span>}
        </td>
        <td className="px-2 py-2">
          {semComprovanteTarefa ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <IconeComprovante tem={false} />
              <span className="text-[10px]">-</span>
              <CameraOff size={12} />
            </span>
          ) : (
            <IconeComprovante tem={true} />
          )}
        </td>
        <td className="px-2 py-2 text-[11px] ">{tarefa.peso > 0 ? fmt(tarefa.peso, "peso") : "--"}</td>
        <td className="px-2 py-2 text-[11px] ">{tarefa.cubagem > 0 ? fmt(tarefa.cubagem, "cubagem") : "--"}</td>
        <td className="px-2 py-2 text-[11px]  font-medium">{fmt(tarefa.valorTotal, "moeda")}</td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={tarefa.validacao.entregaRoterizada} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={tarefa.validacao.volumeEmbarcadoVal} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={tarefa.validacao.registroEntrega} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={tarefa.validacao.chegadaSaidaInformada} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={tarefa.validacao.ordemRoteirizacao} /></td>
        <td className="px-2 py-2 text-center"><ValidacaoBadge valor={tarefa.validacao.rotaFinalizada} /></td>
        <td className="px-2 py-2 text-center">
          <div className="flex items-center gap-1 justify-center">
            <ResultadoBadge validacao={tarefa.validacao} />
          </div>
        </td>
        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={tarefa.concluida ? "outline" : "default"}
              className={`h-6 text-[10px] px-2 whitespace-nowrap ${tarefa.concluida ? "opacity-50 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 text-white"}`}
              onClick={() => !tarefa.concluida && alert(`Finalizando tarefa ${tarefa.idTarefa}`)}
              disabled={tarefa.concluida}
            >
              {tarefa.concluida ? "Finalizada" : "Finalizar tarefa"}
            </Button>
            <ElipsisMenu items={[
              { label: "Exportar Deslocamentos desta Tarefa", icon: <Download size={12} />, action: () => alert(`Exportando deslocamentos ${tarefa.idTarefa}`) },
              { label: "Alterar ordem de entrega", icon: <ChevronRight size={12} />, action: () => onAlterarOrdem(tarefa) },
            ]} />
          </div>
        </td>
      </tr>

      {expandido && (
        <tr>
          <td colSpan={32} className="px-5 pb-3 bg-amber-50/30 overflow-visible">
            <div className="mt-2 border border-amber-200 rounded-md bg-white overflow-visible">
              <div className="flex border-b border-amber-200 bg-amber-50 relative z-10">
                {(["visao","deslocamento","pausa","pedagio"] as const).map((a) => {
                  const labels: Record<string, string> = { visao: "Visão Gráfica", deslocamento: "Deslocamento", pausa: "Pausa", pedagio: "Pedágio" };
                  return (
                    <button
                      key={a}
                      onClick={() => setAba(a)}
                      className={`px-4 py-1.5 text-[11px] font-medium transition-colors border-r border-amber-200 last:border-r-0 ${aba === a ? "bg-white text-amber-700 border-b border-b-white -mb-px" : "text-gray-600 hover:bg-amber-100"}`}
                    >
                      {labels[a]}
                    </button>
                  );
                })}
              </div>
              <div className="bg-white">
                {aba === "visao" && <TimelineTarefa tarefa={tarefa} />}
                {aba === "deslocamento" && <DeslocamentoTarefa tarefa={tarefa} />}
                {aba === "pausa" && <PausaTarefa tarefa={tarefa} />}
                {aba === "pedagio" && <PedagioTarefa tarefa={tarefa} />}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// â”€â”€â”€ Aba Tarefas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AbaTarefasProps {
  tarefas: Tarefa[];
  filtroStatus: StatusPedido[];
  filtroOperacaoGlobal: string;
}

export function AbaTarefas({ tarefas, filtroStatus, filtroOperacaoGlobal }: AbaTarefasProps) {
  const formatarOrdemCliente = (valor: string, ordem: number) => {
    const texto = (valor || "").trim();
    if (!texto || texto === "-" || texto === "--") return "--";
    if (texto.includes("Galpão") || texto.includes("Galpao")) return texto;
    if (/^\d+°-/.test(texto)) return texto;
    return `${ordem}°-${texto}`;
  };
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStatusLocal, setFiltroStatusLocal] = useState("");
  const [filtroRoteirizado, setFiltroRoteirizado] = useState("");
  const [filtroRessalva, setFiltroRessalva] = useState("");
  const [filtroComprovante, setFiltroComprovante] = useState("");
  const [ordemModal, setOrdemModal] = useState<{ tarefaId: string; base: ParadaTimeline[]; clientes: string[]; tarefa: Tarefa } | null>(null);
  const [timelineOverrides, setTimelineOverrides] = useState<Record<string, ParadaTimeline[]>>({});
  const [deslocamentoOverrides, setDeslocamentoOverrides] = useState<Record<string, Tarefa["deslocamentos"]>>({});

  const tarefasComValidacao = tarefas.map((t) => {
    const timeline = timelineOverrides[t.id] ?? t.timeline;
    const deslocamentos = deslocamentoOverrides[t.id] ?? t.deslocamentos;
    const pedidosTarefa = PEDIDOS.filter((p) => t.listaPedidos.includes(p.nPedido));
    const volumeAtual = pedidosTarefa.reduce((s, p) => s + p.qtdVolumes, 0);
    const volumeTotal = pedidosTarefa.reduce((s, p) => s + p.qtdVolumesTotal, 0);
    return {
      ...t,
      timeline,
      deslocamentos,
      atual: formatarOrdemCliente(t.atual, 1),
      proximoCliente: formatarOrdemCliente(t.proximoCliente, 2),
      qtdVolumes: `${volumeAtual}/${volumeTotal}`,
      valRoterizada: t.validacao.entregaRoterizada ? "Sim" : "Não",
      valVolEmb: t.validacao.volumeEmbarcadoVal ? "Sim" : "Não",
      valRegEntrega: t.validacao.registroEntrega ? "Sim" : "Não",
      valChegSaida: t.validacao.chegadaSaidaInformada ? "Sim" : "Não",
      valOrdemRot: t.validacao.ordemRoteirizacao ? "Sim" : "Não",
      valRotaFinal: t.validacao.rotaFinalizada ? "Sim" : "Não",
      valResultado: calcularResultado(t.validacao),
    };
  });

  const { sorted, sortConfig, handleSort } = useSortable(tarefasComValidacao, "ordem");
  const { colFilters, setFilter, clearAllFilters, hasActiveFilters, applyColFilters, getUniqueValues } = useColFilters();

  const uniq = (arr: string[]) => [...new Set(arr)].filter(Boolean).sort();

  const filtradosBase = sorted.filter((t) => {
    if (filtroOperacaoGlobal && t.operacao !== filtroOperacaoGlobal) return false;
    if (filtroStatus.length > 0) {
      const temPedidoFiltrado = t.listaPedidos.some((nPed) => {
        const p = PEDIDOS.find((p) => p.nPedido === nPed);
        if (!p) return false;
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
    if (filtroVeiculo && t.veiculo !== filtroVeiculo) return false;
    if (filtroNome && !t.idTarefa.toLowerCase().includes(filtroNome.toLowerCase())) return false;
    if (filtroStatusLocal && t.status !== filtroStatusLocal) return false;
    if (filtroRoteirizado === "Sim" && !t.roteirizado) return false;
    if (filtroRoteirizado === "Não" && t.roteirizado) return false;
    if (filtroRessalva === "Com Ressalva" && !t.temRessalva) return false;
    if (filtroRessalva === "Sem Ressalva" && t.temRessalva) return false;
    if (filtroComprovante === "Com Comprovante" && !t.comComprovante) return false;
    if (filtroComprovante === "Sem Comprovante" && t.comComprovante) return false;
    return true;
  });
  const filtrados = applyColFilters(filtradosBase as Record<string, unknown>[]) as Tarefa[];
  const totalVolumesFiltrados = filtrados.reduce(
    (acc, t) => {
      const pedidosTarefa = PEDIDOS.filter((p) => t.listaPedidos.includes(p.nPedido));
      acc.atual += pedidosTarefa.reduce((s, p) => s + p.qtdVolumes, 0);
      acc.total += pedidosTarefa.reduce((s, p) => s + p.qtdVolumesTotal, 0);
      return acc;
    },
    { atual: 0, total: 0 }
  );

  function abrirModalOrdem(t: Tarefa) {
    const base = buildTimelineBase(t);
    const clientes = base.filter((p) => p.tipo !== "galpao").map((p) => p.nome);
    setOrdemModal({ tarefaId: t.id, base, clientes, tarefa: t });
  }

  function salvarOrdem(clientes: string[]) {
    if (!ordemModal) return;
    const base = ordemModal.base;
    const inicio = base[0]?.tipo === "galpao" ? base[0] : null;
    const fim = base[base.length - 1]?.tipo === "galpao" ? base[base.length - 1] : null;
    const mapa = new Map(base.map((p) => [p.nome, p]));
    const novasParadas = clientes.map((nome) => {
      const orig = mapa.get(nome);
      return orig ? { ...orig } : { nome, tipo: "cliente", entrada: "", saida: "", permanencia: "planejado" };
    });
    const novaTimeline = [
      ...(inicio ? [inicio] : []),
      ...novasParadas,
      ...(fim ? [fim] : []),
    ];
    const pontos = [
      ...(inicio ? [inicio.nome] : []),
      ...novasParadas.map((p) => p.nome),
      ...(fim ? [fim.nome] : []),
    ];
    const destinoIndex = new Map(pontos.map((nome, i) => [nome, i]));
    const novosDeslocamentos = [...ordemModal.tarefa.deslocamentos]
      .sort((a, b) => (destinoIndex.get(a.destino) ?? 999) - (destinoIndex.get(b.destino) ?? 999))
      .map((d, i) => ({ ...d, ordem: i + 1 }));
    setTimelineOverrides((prev) => ({ ...prev, [ordemModal.tarefaId]: novaTimeline }));
    setDeslocamentoOverrides((prev) => ({ ...prev, [ordemModal.tarefaId]: novosDeslocamentos }));
    setOrdemModal(null);
  }

  return (
    <div className="flex flex-col h-full">
      {ordemModal && (
        <ModalOrdemEntrega
          clientesIniciais={ordemModal.clientes}
          onClose={() => setOrdemModal(null)}
          onSave={salvarOrdem}
        />
      )}
      {/* Filtros */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-wrap">
        {/*
        <SearchSelect placeholder="Todos Veículos" options={uniq(tarefas.map((t) => t.veiculo))} value={filtroVeiculo} onChange={setFiltroVeiculo} />
        */}
        <input
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          placeholder="Nome da tarefa..."
          className="h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-36"
        />
        {/* 
        <SearchSelect placeholder="Todos Status" options={uniq(tarefas.map((t) => t.status))} value={filtroStatusLocal} onChange={setFiltroStatusLocal} />
        <SearchSelect placeholder="Roteirizado" options={["Sim","Não"]} value={filtroRoteirizado} onChange={setFiltroRoteirizado} />
        <SearchSelect placeholder="Ressalva" options={["Com Ressalva", "Sem Ressalva"]} value={filtroRessalva} onChange={setFiltroRessalva} />
        <SearchSelect placeholder="Comprovante" options={["Com Comprovante", "Sem Comprovante"]} value={filtroComprovante} onChange={setFiltroComprovante} />
        */}
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 h-7 px-2.5 text-[11px] bg-amber-50 text-amber-700 rounded border border-amber-300 hover:bg-amber-100"
          >
            Limpar filtros de coluna ×
          </button>
        )}
        <ActionDropdownButton
          label="Exportar"
          icon={<Download size={12} />}
          className="ml-auto"
          items={[
            { label: "Tarefas", icon: <Download size={12} />, action: () => alert("Exportando tarefas...") },
            { label: "Deslocamentos", icon: <Download size={12} />, action: () => alert("Exportando deslocamentos...") },
            { label: "Pausas", icon: <Download size={12} />, action: () => alert("Exportando pausas...") },
            { label: "Pedágios", icon: <Download size={12} />, action: () => alert("Exportando pedágios...") },
          ]}
        />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="w-7" />
              <ColFilterTh label="Ordem" sortKey="ordem" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "ordem")} selected={colFilters["ordem"] ?? new Set()} onFilterChange={(s) => setFilter("ordem", s)} />
              <ColFilterTh label="ID Tarefa" sortKey="idTarefa" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "idTarefa")} selected={colFilters["idTarefa"] ?? new Set()} onFilterChange={(s) => setFilter("idTarefa", s)} />
              <ColFilterTh label="Operação" sortKey="operacao" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "operacao")} selected={colFilters["operacao"] ?? new Set()} onFilterChange={(s) => setFilter("operacao", s)} />
              <ColFilterTh label="Veículo" sortKey="veiculo" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "veiculo")} selected={colFilters["veiculo"] ?? new Set()} onFilterChange={(s) => setFilter("veiculo", s)} />
              <ColFilterTh label="Motorista" sortKey="motorista" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "motorista")} selected={colFilters["motorista"] ?? new Set()} onFilterChange={(s) => setFilter("motorista", s)} />
              <ColFilterTh label="Ajudante" sortKey="ajudante" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "ajudante")} selected={colFilters["ajudante"] ?? new Set()} onFilterChange={(s) => setFilter("ajudante", s)} />
              <ColFilterTh label="Dt. Roteir." sortKey="dataRoteirizacao" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "dataRoteirizacao")} selected={colFilters["dataRoteirizacao"] ?? new Set()} onFilterChange={(s) => setFilter("dataRoteirizacao", s)} />
              <ColFilterTh label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "status")} selected={colFilters["status"] ?? new Set()} onFilterChange={(s) => setFilter("status", s)} />
              <ColFilterTh label="Início Prev." sortKey="inicioPrevisto" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "inicioPrevisto")} selected={colFilters["inicioPrevisto"] ?? new Set()} onFilterChange={(s) => setFilter("inicioPrevisto", s)} />
              <ColFilterTh label="Início" sortKey="inicio" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "inicio")} selected={colFilters["inicio"] ?? new Set()} onFilterChange={(s) => setFilter("inicio", s)} />
              <ColFilterTh label="Término" sortKey="termino" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "termino")} selected={colFilters["termino"] ?? new Set()} onFilterChange={(s) => setFilter("termino", s)} />
              <ColFilterTh label="Atual" sortKey="atual" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "atual")} selected={colFilters["atual"] ?? new Set()} onFilterChange={(s) => setFilter("atual", s)} />
              <ColFilterTh label="Próx. Cliente" sortKey="proximoCliente" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "proximoCliente")} selected={colFilters["proximoCliente"] ?? new Set()} onFilterChange={(s) => setFilter("proximoCliente", s)} />
              <ColFilterTh label="Pedidos" sortKey="nPedidos" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "nPedidos")} selected={colFilters["nPedidos"] ?? new Set()} onFilterChange={(s) => setFilter("nPedidos", s)} />
              <ColFilterTh label="Qtd Vol." sortKey="qtdVolumes" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "qtdVolumes")} selected={colFilters["qtdVolumes"] ?? new Set()} onFilterChange={(s) => setFilter("qtdVolumes", s)} />
              <ColFilterTh label="Ressalva" sortKey="tipoRessalva" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "tipoRessalva")} selected={colFilters["tipoRessalva"] ?? new Set()} onFilterChange={(s) => setFilter("tipoRessalva", s)} />
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-600">Comprovante</th>
              <ColFilterTh label="Peso" sortKey="peso" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "peso")} selected={colFilters["peso"] ?? new Set()} onFilterChange={(s) => setFilter("peso", s)} className="" />
              <ColFilterTh label="Cubagem" sortKey="cubagem" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "cubagem")} selected={colFilters["cubagem"] ?? new Set()} onFilterChange={(s) => setFilter("cubagem", s)} className="" />
              <ColFilterTh label="Valor Total" sortKey="valorTotal" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "valorTotal")} selected={colFilters["valorTotal"] ?? new Set()} onFilterChange={(s) => setFilter("valorTotal", s)} className="" />
              <ColFilterTh label="Roterizada?" sortKey="valRoterizada" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Motorista" values={getUniqueValues(sorted, "valRoterizada")} selected={colFilters["valRoterizada"] ?? new Set()} onFilterChange={(s) => setFilter("valRoterizada", s)} />
              <ColFilterTh label="Vol. Emb.?" sortKey="valVolEmb" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Ajudante" values={getUniqueValues(sorted, "valVolEmb")} selected={colFilters["valVolEmb"] ?? new Set()} onFilterChange={(s) => setFilter("valVolEmb", s)} />
              <ColFilterTh label="Reg. Entrega?" sortKey="valRegEntrega" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Ajudante" values={getUniqueValues(sorted, "valRegEntrega")} selected={colFilters["valRegEntrega"] ?? new Set()} onFilterChange={(s) => setFilter("valRegEntrega", s)} />
              <ColFilterTh label="Cheg./Saída?" sortKey="valChegSaida" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Motorista" values={getUniqueValues(sorted, "valChegSaida")} selected={colFilters["valChegSaida"] ?? new Set()} onFilterChange={(s) => setFilter("valChegSaida", s)} />
              <ColFilterTh label="Ordem Rot.?" sortKey="valOrdemRot" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Motorista" values={getUniqueValues(sorted, "valOrdemRot")} selected={colFilters["valOrdemRot"] ?? new Set()} onFilterChange={(s) => setFilter("valOrdemRot", s)} />
              <ColFilterTh label="Rota Final.?" sortKey="valRotaFinal" sortConfig={sortConfig} onSort={handleSort} tooltip="Responsável: Motorista" values={getUniqueValues(sorted, "valRotaFinal")} selected={colFilters["valRotaFinal"] ?? new Set()} onFilterChange={(s) => setFilter("valRotaFinal", s)} />
              <ColFilterTh label="Andamento" sortKey="valResultado" sortConfig={sortConfig} onSort={handleSort} values={getUniqueValues(sorted, "valResultado")} selected={colFilters["valResultado"] ?? new Set()} onFilterChange={(s) => setFilter("valResultado", s)} />
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-600 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filtrados.map((t) => (
              <LinhaTarefa key={t.id} tarefa={t} onAlterarOrdem={abrirModalOrdem} />
            ))}
            <TotalRow>
              <td />
              <td className="px-2 py-1.5 text-[10px] text-gray-500 uppercase" colSpan={13}>{filtrados.length} tarefa(s)</td>
              <td className="px-2 py-1.5 text-[11px] text-center font-bold">{filtrados.reduce((s, t) => s + t.nPedidos, 0)}</td>
              <td className="px-2 py-1.5 text-[11px] text-center font-bold">{totalVolumesFiltrados.atual}/{totalVolumesFiltrados.total}</td>
              <td />
              <td className="px-2 py-1.5 text-[11px]  font-bold">{fmt(filtrados.reduce((s, t) => s + t.peso, 0), "peso")}</td>
              <td className="px-2 py-1.5 text-[11px]  font-bold">{fmt(filtrados.reduce((s, t) => s + t.cubagem, 0), "cubagem")}</td>
              <td className="px-2 py-1.5 text-[11px]  font-bold">{fmt(filtrados.reduce((s, t) => s + t.valorTotal, 0), "moeda")}</td>
              <td colSpan={8} />
            </TotalRow>
          </tbody>
        </table>
      </div>
    </div>
  );
}





