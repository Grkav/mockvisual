"use client";

import { type MouseEvent, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

const CONTATOS_NORMALIZADOS = new Map(
  Object.entries(CONTATOS_EQUIPE).map(([nome, telefone]) => [normalizarNome(nome), telefone]),
);

function normalizarNome(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterTelefoneEquipe(nome: string) {
  if (!nome) return null;
  return CONTATOS_EQUIPE[nome] ?? CONTATOS_NORMALIZADOS.get(normalizarNome(nome)) ?? null;
}

export function EquipeContatoTooltip({ nome }: { nome: string }) {
  const [copiado, setCopiado] = useState(false);
  const telefone = obterTelefoneEquipe(nome);

  async function copiarTelefone(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!telefone) return;

    try {
      await navigator.clipboard.writeText(telefone);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1200);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex cursor-help underline decoration-dotted underline-offset-2"
          onClick={(event) => event.stopPropagation()}
        >
          {nome || "--"}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="px-2 py-2">
        <div className="flex min-w-[190px] items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] opacity-80">{nome || "Sem nome"}</span>
            <span className="font-mono text-[11px]">{telefone ?? "--"}</span>
          </div>
          <button
            type="button"
            onClick={copiarTelefone}
            disabled={!telefone}
            className="inline-flex items-center gap-1 rounded border border-white/35 px-1.5 py-1 text-[10px] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiado ? <Check size={12} /> : <Copy size={12} />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
