"use client";

import { useState, useEffect, useCallback } from "react";
import { PEDIDOS, VEICULOS, TAREFAS, calcularCards } from "@/lib/mock-data";
import type { StatusPedido } from "@/lib/mock-data";
import {
  Header, ModuleTitle, FiltrosGlobais, CardsStatus,
} from "@/components/logistica/layout-components";
import { AbaVeiculos } from "@/components/logistica/aba-veiculos";
import { AbaPedidos } from "@/components/logistica/aba-pedidos";
import { AbaTarefas } from "@/components/logistica/aba-tarefas";

type AbaAtiva = "veiculos" | "pedidos" | "tarefas";

export default function AcompanhamentoPage() {
  // â”€â”€ Estado de filtros globais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [filtroData, setFiltroData] = useState("2025-03-25");
  const [filtroOperacao, setFiltroOperacao] = useState("");
  const [filtroTransportadora, setFiltroTransportadora] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [filtroPedido, setFiltroPedido] = useState("");
  const [filtroRemessa, setFiltroRemessa] = useState("");
  const [autoAtualizar, setAutoAtualizar] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(30);
  const [lastUpdate, setLastUpdate] = useState("");
  const [cardsAtivos, setCardsAtivos] = useState<StatusPedido[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("pedidos");

  const handleCardClick = (status: StatusPedido | null) => {
    if (!status) {
      setCardsAtivos([]);
      return;
    }
    setCardsAtivos((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    if (status === "Não Programado" || status === "Pendente" || status === "Cancelado") {
      setAbaAtiva("pedidos");
    }
  };

  // â”€â”€ Data/hora de atualizaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    setLastUpdate(
      new Date().toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      })
    );
  }, []);

  // â”€â”€ Auto-atualizaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAtualizar = useCallback(() => {
    setLastUpdate(
      new Date().toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      })
    );
  }, []);

  useEffect(() => {
    if (!autoAtualizar) {
      setAutoCountdown(30);
      return;
    }

    handleAtualizar();
    setAutoCountdown(30);

    const interval = setInterval(() => {
      setAutoCountdown((prev) => {
        if (prev <= 1) {
          handleAtualizar();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoAtualizar, handleAtualizar]);

  // â”€â”€ Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pedidosFiltradosGlobal = PEDIDOS.filter((p) => {
    if (filtroOperacao && p.operacao !== filtroOperacao) return false;
    if (filtroPrioridade && p.prioridade !== filtroPrioridade) return false;
    if (filtroPedido && !p.nPedido.toLowerCase().includes(filtroPedido.toLowerCase())) return false;
    if (filtroRemessa && !p.nRemessa.toLowerCase().includes(filtroRemessa.toLowerCase())) return false;
    return true;
  });

  const cards = calcularCards(pedidosFiltradosGlobal);
  const operacoes = [...new Set(PEDIDOS.map((p) => p.operacao))].sort();

  const abas: { key: AbaAtiva; label: string }[] = [
    { key: "pedidos", label: "Pedidos" },
    { key: "veiculos", label: "Veículos" },
    { key: "tarefas", label: "Tarefas" },
  ];

  const pedidosParaAba = PEDIDOS.filter((p) => {
    if (filtroOperacao && p.operacao !== filtroOperacao) return false;
    if (filtroPedido && !p.nPedido.toLowerCase().includes(filtroPedido.toLowerCase())) return false;
    if (filtroRemessa && !p.nRemessa.toLowerCase().includes(filtroRemessa.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      {/* Header */}
      <Header />
      <ModuleTitle />

      {/* Filtros globais */}
      <FiltrosGlobais
        filtroData={filtroData} setFiltroData={setFiltroData}
        filtroOperacao={filtroOperacao} setFiltroOperacao={setFiltroOperacao}
        filtroTransportadora={filtroTransportadora} setFiltroTransportadora={setFiltroTransportadora}
        filtroPrioridade={filtroPrioridade} setFiltroPrioridade={setFiltroPrioridade}
        filtroPedido={filtroPedido} setFiltroPedido={setFiltroPedido}
        filtroRemessa={filtroRemessa} setFiltroRemessa={setFiltroRemessa}
        autoAtualizar={autoAtualizar} setAutoAtualizar={setAutoAtualizar}
        autoCountdown={autoCountdown}
        onAtualizar={handleAtualizar}
        lastUpdate={lastUpdate}
        operacoes={operacoes}
        transportadoras={[...new Set(VEICULOS.map((v) => v.transportadora))].filter(Boolean).sort()}
      />

      {/* Cards de status */}
      <CardsStatus cards={cards} cardsAtivos={cardsAtivos} onCardClick={handleCardClick} />

      {/* Abas */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Tabs header */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4">
          {abas.map((aba) => (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`px-5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${aba.key === "pedidos" ? "min-w-[205px]" : ""} ${
                abaAtiva === aba.key
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {aba.label}
              {aba.key === "veiculos" && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-600">
                  {VEICULOS.length}
                </span>
              )}
              {aba.key === "pedidos" && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-600">
                  {pedidosParaAba.length}
                </span>
              )}
              {aba.key === "tarefas" && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-600">
                  {TAREFAS.length}
                </span>
              )}
            </button>
          ))}

          {cardsAtivos.length > 0 && (
            <div className="ml-4 flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Filtrando por: <strong>{cardsAtivos.join(", ")}</strong>
            </div>
          )}


        </div>

        {/* ConteÃºdo da aba */}
        <div className="flex-1 overflow-visible">
          {abaAtiva === "veiculos" && (
            <AbaVeiculos veiculos={VEICULOS} filtroStatus={cardsAtivos} filtroTransportadoraGlobal={filtroTransportadora} />
          )}
          {abaAtiva === "pedidos" && (
            <AbaPedidos
              pedidos={pedidosParaAba}
              filtroStatus={cardsAtivos}
              filtroPrioridade={filtroPrioridade}
              filtroPedidoGlobal={filtroPedido}
              filtroRemessaGlobal={filtroRemessa}
              filtroOperacaoGlobal={filtroOperacao}
            />
          )}
          {abaAtiva === "tarefas" && (
            <AbaTarefas
              tarefas={TAREFAS}
              filtroStatus={cardsAtivos}
              filtroOperacaoGlobal={filtroOperacao}
            />
          )}
        </div>
      </div>
    </div>
  );
}

