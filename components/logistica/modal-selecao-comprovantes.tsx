"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import type { Comprovante, Pedido } from "@/lib/mock-data";

export interface OpcaoComprovante {
  id: string;
  titulo: string;
  comprovante: Comprovante;
}

export interface GrupoComprovantes {
  pedidoId: string;
  pedidoNum: string;
  opcoes: OpcaoComprovante[];
}

export function montarGruposComprovantes(pedidos: Pedido[]): GrupoComprovantes[] {
  return pedidos
    .map((pedido) => ({
      pedidoId: pedido.id,
      pedidoNum: pedido.nPedido,
      opcoes: pedido.comprovantes.map((comprovante, indice) => ({
        id: comprovante.id,
        titulo: `${comprovante.tipo || "Comprovante"} ${indice + 1}`,
        comprovante,
      })),
    }))
    .filter((grupo) => grupo.opcoes.length > 0);
}

interface ModalSelecaoComprovantesProps {
  titulo: string;
  grupos: GrupoComprovantes[];
  onSelecionar: (pedidoNum: string, comprovantes: Comprovante[], indice: number) => void;
  onClose: () => void;
}

function ModalSelecaoComprovantesInner({
  titulo,
  grupos,
  onSelecionar,
  onClose,
}: ModalSelecaoComprovantesProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35" onClick={onClose}>
      <div
        className="w-[560px] max-w-[92vw] max-h-[78vh] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 transition hover:text-gray-700">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {grupos.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum comprovante disponível.</p>
          ) : (
            <div className="space-y-2">
              {grupos.map((grupo) => {
                const comprovantes = grupo.opcoes.map((opcao) => opcao.comprovante);
                return (
                  <details key={grupo.pedidoId} className="rounded-md border border-gray-200 bg-gray-50" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-semibold text-gray-700">
                      <span>Pedido {grupo.pedidoNum}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                        {grupo.opcoes.length} comprovante(s)
                        <ChevronDown size={12} />
                      </span>
                    </summary>
                    <div className="space-y-1 border-t border-gray-200 bg-white p-2.5">
                      {grupo.opcoes.map((opcao, indice) => (
                        <button
                          key={opcao.id}
                          type="button"
                          onClick={() => onSelecionar(grupo.pedidoNum, comprovantes, indice)}
                          className="flex w-full items-center justify-between rounded-md border border-gray-200 px-2.5 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <span className="text-[11px] font-semibold text-gray-800">{opcao.titulo}</span>
                          <span className="max-w-[52%] truncate text-[10px] text-blue-700">{opcao.comprovante.arquivo}</span>
                        </button>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalSelecaoComprovantes(props: ModalSelecaoComprovantesProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<ModalSelecaoComprovantesInner {...props} />, document.body);
}
