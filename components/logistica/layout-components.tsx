"use client";

import { Fragment, useState, useEffect, useLayoutEffect, useRef } from "react";
import { Bell, RefreshCw, ChevronDown, Search, User, Filter, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StatusPedido, CardStatus, ValidacaoOperacional } from "@/lib/mock-data";

// â”€â”€â”€ ColFilter: filtro de coluna estilo Excel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ColFilterState {
  [colKey: string]: Set<string>;
}

interface ColFilterThProps {
  label: string;
  sortKey: string;
  sortConfig: { key: string; dir: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  tooltip?: string;
  // Valores Ãºnicos disponÃ­veis para este filtro
  values: string[];
  // Valores atualmente selecionados para este filtro (vazio = tudo)
  selected: Set<string>;
  onFilterChange: (selected: Set<string>) => void;
  className?: string;
}

export function ColFilterTh({
  label, sortKey, sortConfig, onSort,
  tooltip, values, selected, onFilterChange, className = "",
}: ColFilterThProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; placeAbove: boolean; maxHeight: number } | null>(null);

  const active = sortConfig?.key === sortKey;
  const hasFilter = selected.size > 0;
  const filtered = values.filter((v) => v.toLowerCase().includes(search.toLowerCase()));

  function toggle(val: string) {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onFilterChange(next);
  }

  function selectAll() {
    onFilterChange(new Set<string>());
  }

  function selectOnly(val: string) {
    onFilterChange(new Set([val]));
  }

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const menuWidth = 208; // w-52
    const left = Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, placeAbove ? spaceAbove : spaceBelow);
    const top = placeAbove ? rect.top - 4 : rect.bottom + 4;
    setMenuPos({ top, left, placeAbove, maxHeight });
  }, [open]);

  return (
    <th className={`relative px-0 py-0 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap ${className}`}>
      <div className="flex items-center">
        {/* Clique no label = sort */}
        <button
          onClick={() => onSort(sortKey)}
          className="flex items-center gap-0.5 px-2 py-1.5 hover:bg-gray-100 select-none flex-1"
          title={tooltip ?? `Ordenar por ${label}`}
        >
          {label}
          <span className={`ml-0.5 ${active ? "text-blue-600" : "text-gray-300"}`}>
            {active ? (
              sortConfig?.dir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
            ) : (
              <ArrowUpDown size={10} />
            )}
          </span>
        </button>
        {/* Botão de filtro */}
        <div ref={ref} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => {
                  if (o) setMenuPos(null);
                  return !o;
                });
              }}
            className={`flex items-center justify-center w-5 h-6 mr-0.5 rounded transition-colors ${
              hasFilter
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title={hasFilter ? `${selected.size} filtro(s) ativo(s)` : "Filtrar coluna"}
          >
            <Filter size={9} />
            {hasFilter && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 border border-white rounded-full text-[7px] flex items-center justify-center text-white font-bold">
                {selected.size}
              </span>
            )}
          </button>

            {open && menuPos && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />
                <div
                  className="fixed z-50 bg-white border border-gray-200 rounded shadow-xl w-52 text-xs"
                  style={{
                    top: menuPos?.top ?? 0,
                    left: menuPos?.left ?? 0,
                    transform: menuPos?.placeAbove ? "translateY(-100%)" : "none",
                    maxHeight: menuPos?.maxHeight ?? undefined,
                  }}
                >
                {/* Pesquisa */}
                <div className="p-1.5 border-b border-gray-100">
                  <div className="relative">
                    <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquisar..."
                      className="w-full pl-6 pr-2 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>
                {/* Ações rÃ¡pidas */}
                <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-100 bg-gray-50">
                  <button
                    onClick={selectAll}
                    className="flex-1 text-[10px] text-blue-600 hover:underline text-left font-medium"
                  >
                    Selecionar tudo
                  </button>
                  {hasFilter && (
                    <button
                      onClick={selectAll}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {/* Lista de valores */}
                <div className="max-h-52 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] text-gray-400">Sem resultados</p>
                  ) : (
                    filtered.map((val) => (
                      <label
                        key={val}
                        className="flex items-center gap-2 px-2.5 py-1 hover:bg-blue-50 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selected.size === 0 || selected.has(val)}
                          onChange={() => {
                            // Se estÃ¡ em "tudo selecionado" (set vazio), marcar só este = desselecionar os outros
                            if (selected.size === 0) {
                              // Cria set com todos menos este
                              const todos = new Set(values.filter((v) => v !== val));
                              onFilterChange(todos);
                            } else {
                              toggle(val);
                            }
                          }}
                          className="accent-blue-600 w-3 h-3"
                        />
                        <span className={`flex-1 text-[11px] truncate ${selected.has(val) || selected.size === 0 ? "text-gray-800" : "text-gray-400"}`}>
                          {val || "(vazio)"}
                        </span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectOnly(val); }}
                          className="text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 hover:underline shrink-0"
                        >
                          só este
                        </button>
                      </label>
                    ))
                  )}
                </div>
                {/* Rodapé */}
                {hasFilter && (
                  <div className="px-2.5 py-1.5 border-t border-gray-100 bg-blue-50 text-[10px] text-blue-700 font-medium">
                    {selected.size} de {values.length} selecionado(s)
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </th>
  );
}

// â”€â”€â”€ Hook para gerenciar filtros de colunas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useColFilters() {
  const [colFilters, setColFilters] = useState<ColFilterState>({});

  function setFilter(key: string, selected: Set<string>) {
    setColFilters((prev) => {
      const next = { ...prev };
      if (selected.size === 0) {
        delete next[key];
      } else {
        next[key] = selected;
      }
      return next;
    });
  }

  function clearAllFilters() {
    setColFilters({});
  }

  function hasActiveFilters() {
    return Object.keys(colFilters).length > 0;
  }

  // Aplica filtros de colunas a um array de dados
  function applyColFilters<T extends Record<string, unknown>>(data: T[]): T[] {
    if (Object.keys(colFilters).length === 0) return data;
    return data.filter((row) =>
      Object.entries(colFilters).every(([key, selected]) => {
        const val = String(row[key] ?? "");
        return selected.has(val);
      })
    );
  }

  // Obtém valores Ãºnicos de uma coluna (do dataset completo, nÃ£o filtrado)
  function getUniqueValues<T extends Record<string, unknown>>(data: T[], key: string): string[] {
    const vals = [...new Set(data.map((r) => String(r[key] ?? "")))].filter(Boolean).sort();
    return vals;
  }

  return { colFilters, setFilter, clearAllFilters, hasActiveFilters, applyColFilters, getUniqueValues };
}

// â”€â”€â”€ SearchSelect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface SearchSelectProps {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export function SearchSelect({ placeholder, options, value, onChange, className = "" }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const display = value || placeholder;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-8 px-2.5 text-xs bg-white border border-gray-300 rounded hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[130px] w-full"
      >
        <span className={`flex-1 text-left truncate ${!value ? "text-gray-400" : "text-gray-800"}`}>{display}</span>
        <ChevronDown size={12} className="text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full min-w-[180px] bg-white border border-gray-200 rounded shadow-lg">
          <div className="p-1.5 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50"
            >
              {placeholder}
            </button>
            {filtered.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 ${value === opt ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
              >
                {opt}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">Nenhum resultado</p>
            )}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}

// â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Header() {
  return (
    <header className="bg-[#1a3c6e] text-white px-5 py-2.5 flex items-center justify-between border-b border-[#154a8a]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-400 rounded flex items-center justify-center text-xs font-bold">TL</div>
          <span className="text-sm font-semibold tracking-wide">TMS Sistema</span>
        </div>
        
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-blue-200 hover:text-white">
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-1.5 text-blue-200 hover:text-white cursor-pointer">
          <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
            <User size={12} />
          </div>
          <span className="text-xs">Admin</span>
          <ChevronDown size={10} />
        </div>
      </div>
    </header>
  );
}

// â”€â”€â”€ Módulo título â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ModuleTitle() {
  return (
    <div className="bg-[#1e4a80] px-5 py-2 border-b border-[#154a8a]">
      <div className="flex items-center gap-2">
        <span className="text-blue-300 text-xs">Operação</span>
        <span className="text-blue-400 text-xs">/</span>
        <span className="text-white text-xs font-medium">Acompanhamento</span>
      </div>
    </div>
  );
}

// â”€â”€â”€ Filtros Globais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface FiltrosGlobaisProps {
  filtroData: string;
  setFiltroData: (v: string) => void;
  filtroOperacao: string;
  setFiltroOperacao: (v: string) => void;
  filtroTransportadora: string;
  setFiltroTransportadora: (v: string) => void;
  filtroPrioridade: string;
  setFiltroPrioridade: (v: string) => void;
  filtroPedido: string;
  setFiltroPedido: (v: string) => void;
  autoAtualizar: boolean;
  setAutoAtualizar: (v: boolean) => void;
  autoCountdown: number;
  onAtualizar: () => void;
  lastUpdate: string;
  operacoes: string[];
  transportadoras: string[];
}

export function FiltrosGlobais({
  filtroData, setFiltroData, filtroOperacao, setFiltroOperacao,
  filtroTransportadora, setFiltroTransportadora,
  filtroPrioridade, setFiltroPrioridade, filtroPedido, setFiltroPedido,
  autoAtualizar, setAutoAtualizar, autoCountdown, onAtualizar, lastUpdate, operacoes, transportadoras,
}: FiltrosGlobaisProps) {
  return (
    <div className="bg-[#f0f4fa] border-b border-gray-200 px-5 py-2.5">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className=" flex items-center space-x-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Filtros</span>
        <input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filtroPedido}
            onChange={(e) => setFiltroPedido(e.target.value)}
            placeholder="Pesquisar pedido..."
            className="h-8 pl-6 pr-3 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-40"
          />
        </div>
        <SearchSelect
          placeholder="Todas Operações"
          options={operacoes}
          value={filtroOperacao}
          onChange={setFiltroOperacao}
        />
        <SearchSelect
          placeholder="Todas Prioridades"
          options={["A", "B", "C", "D", "E", "F"]}
          value={filtroPrioridade}
          onChange={setFiltroPrioridade}
        />
        </div>
        
       
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-gray-600 whitespace-nowrap">
            Última Atualização: <strong className="text-gray-800">{lastUpdate}</strong>
          </span>
          <button
            onClick={() => setAutoAtualizar(!autoAtualizar)}
            className={`flex items-center gap-1.5 h-8 px-3 text-xs rounded border transition-colors ${
              autoAtualizar
                ? "bg-green-50 border-green-400 text-green-700"
                : "bg-white border-gray-300 text-gray-600"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoAtualizar ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            {autoAtualizar ? `AUTO - ${autoCountdown}s` : "OFF"}
          </button>
          <Button
            onClick={onAtualizar}
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-blue-400 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw size={12} />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Cards de Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface CardsStatusProps {
  cards: CardStatus[];
  cardsAtivos: StatusPedido[];
  onCardClick: (status: StatusPedido | null) => void;
}

export function CardsStatus({ cards, cardsAtivos, onCardClick }: CardsStatusProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-5 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        {cards.map((card) => {
          const ativo = cardsAtivos.includes(card.label);
          return (
          <Fragment key={card.label}>
            <button
              onClick={() => onCardClick(card.label)}
              className={`flex flex-col items-center px-3 py-1.5 rounded border transition-all cursor-pointer min-w-[90px] ${
                ativo
                  ? `${card.bgColor} ${card.borderColor} ${card.color} ring-2 ring-offset-1 ring-current shadow-sm`
                  : `bg-white border-gray-200 hover:${card.bgColor} hover:${card.borderColor}`
              }`}
            >
              <span className={`text-lg font-bold leading-none ${ativo ? card.color : "text-gray-800"}`}>
                {card.count}
              </span>
              <span className={`text-[10px] mt-0.5 leading-tight text-center ${ativo ? card.color : "text-gray-500"}`}>
                {card.label}
              </span>
            </button>
            {(card.label === "Pendente" || card.label === "Entregue") && (
              <span className="px-1 text-gray-400 text-lg font-semibold leading-none select-none" aria-hidden>
                -
              </span>
            )}
          </Fragment>
          );
        })}
        {cardsAtivos.length > 0 && (
          <button
            onClick={() => onCardClick(null)}
            className="flex items-center gap-1 h-7 px-2.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200 hover:bg-gray-200 ml-2"
          >
            Limpar filtro ×
          </button>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Badge de status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Entregue": "bg-green-100 text-green-800",
    "Em Trânsito": "bg-cyan-100 text-cyan-800",
    "No Cliente": "bg-indigo-100 text-indigo-800",
    "Com Ressalvas": "bg-red-100 text-red-800",
    "Embarcado": "bg-purple-100 text-purple-800",
    "Parcialmente Embarcado": "bg-orange-100 text-orange-800",
    "Programado": "bg-blue-100 text-blue-800",
    "Pendente": "bg-yellow-100 text-yellow-800",
    "Cancelado": "bg-red-100 text-red-800",
    "Não Programado": "bg-slate-100 text-slate-700",
    "Em Andamento": "bg-cyan-100 text-cyan-800",
    "Concluída": "bg-green-100 text-green-800",
    "Atrasada": "bg-red-100 text-red-800",
    "Em Rota": "bg-cyan-100 text-cyan-800",
    "Finalizado": "bg-green-100 text-green-800",
    "Aguardando": "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// â”€â”€â”€ Ícone comprovante â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function IconeComprovante({ tem }: { tem: boolean }) {
  return tem ? (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100">
      <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
      </svg>
    </span>
  );
}

// â”€â”€â”€ Sortable Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface SortConfig {
  key: string;
  dir: "asc" | "desc";
}

interface SortableThProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTh({ label, sortKey, sortConfig, onSort, className = "" }: SortableThProps) {
  const active = sortConfig?.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap ${className}`}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <span className={active ? "text-blue-600" : "text-gray-300"}>
          {active ? (
            sortConfig?.dir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
          ) : (
            <ArrowUpDown size={10} />
          )}
        </span>
      </span>
    </th>
  );
}

export function useSortable<T>(data: T[], defaultKey: string) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: defaultKey, dir: "asc" });

  function handleSort(key: string) {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  }

  const sorted = [...data].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortConfig.key];
    const bv = (b as Record<string, unknown>)[sortConfig.key];
    if (av === undefined || bv === undefined) return 0;
    if (typeof av === "number" && typeof bv === "number") {
      return sortConfig.dir === "asc" ? av - bv : bv - av;
    }
    const as = String(av).toLowerCase();
    const bs = String(bv).toLowerCase();
    return sortConfig.dir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
  });

  return { sorted, sortConfig, handleSort };
}

// â”€â”€â”€ ElipsisMenu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ElipsisMenuProps {
  items: { label: string; icon?: React.ReactNode; action: () => void; danger?: boolean }[];
}

export function ElipsisMenu({ items }: ElipsisMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 font-bold text-sm"
      >
        ...
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg min-w-[200px]">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); item.action(); setOpen(false); }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 ${item.danger ? "text-red-600" : "text-gray-700"}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// â”€â”€â”€ Linha de totais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function TotalRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
      {children}
    </tr>
  );
}

export function fmt(value: number, tipo: "moeda" | "peso" | "cubagem" | "numero" = "numero"): string {
  if (tipo === "moeda") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (tipo === "peso") return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} kg`;
  if (tipo === "cubagem") return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 3 })} m³`;
  return value.toLocaleString("pt-BR");
}

// â”€â”€â”€ Validação Operacional â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcularResultado(v: ValidacaoOperacional): "Ok" | "Divergência" {
  if (v.pedidoNaoProgramado) return "Divergência";
  const campos = [v.entregaRoterizada, v.volumeEmbarcadoVal, v.registroEntrega, v.chegadaSaidaInformada, v.ordemRoteirizacao, v.rotaFinalizada];
  return campos.every(Boolean) ? "Ok" : "Divergência";
}

export function ValidacaoBadge({ valor }: { valor: boolean }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${valor ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {valor ? "Sim" : "Não"}
    </span>
  );
}

export function ResultadoBadge({ validacao }: { validacao: ValidacaoOperacional }) {
  const resultado = calcularResultado(validacao);
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${resultado === "Ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
      {resultado}
    </span>
  );
}

export function NaoProgramadoBadge() {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-white">
      Não Programado
    </span>
  );
}

export function ThValidacao({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-600 whitespace-nowrap" title={tooltip}>
      <span className="cursor-help border-b border-dotted border-gray-400">{label}</span>
    </th>
  );
}
