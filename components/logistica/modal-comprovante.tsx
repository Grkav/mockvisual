"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Pencil, Save, RotateCcw, ZoomIn, ZoomOut,
  RotateCw, ChevronLeft, ChevronRight, FileText, Image as ImageIcon,
  Check, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Comprovante } from "@/lib/mock-data";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ModalComprovanteProps {
  comprovantes: Comprovante[];
  indiceInicial?: number;
  pedidoNum: string;
  onClose: () => void;
}

// ─── Preview do arquivo (PDF simulado ou imagem) ──────────────────────────────

function PreviewArquivo({
  comprovante,
  zoom,
  rotacao,
}: {
  comprovante: Comprovante;
  zoom: number;
  rotacao: number;
}) {
  const isPdf = comprovante.arquivo.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden rounded-lg relative">
      <div
        style={{ transform: `scale(${zoom}) rotate(${rotacao}deg)`, transition: "transform 0.2s ease" }}
        className="origin-center"
      >
        {isPdf ? (
          /* PDF simulado */
          <div className="w-[420px] bg-white shadow-xl rounded border border-gray-200 p-8 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b pb-3 mb-1">
              <FileText size={20} className="text-red-500" />
              <div>
                <p className="text-xs font-semibold text-gray-800">{comprovante.arquivo}</p>
                <p className="text-[10px] text-gray-400">PDF • Comprovante de Entrega</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="border border-dashed border-gray-300 rounded p-4 mt-2">
              <p className="text-[11px] text-gray-500 text-center">Assinatura do Recebedor</p>
              <div className="mt-3 h-10 border-b border-gray-400 mx-4" />
              <p className="text-[10px] text-gray-400 text-center mt-1">Nome / CPF</p>
            </div>
            <div className="space-y-2 mt-2">
              <div className="h-2 bg-gray-100 rounded w-full" />
              <div className="h-2 bg-gray-100 rounded w-4/5" />
              <div className="h-2 bg-gray-100 rounded w-full" />
              <div className="h-2 bg-gray-100 rounded w-3/5" />
            </div>
            <div className="flex items-center justify-between mt-4 text-[10px] text-gray-400">
              <span>Emitido em: {comprovante.dataHora}</span>
              <span>Usuário: {comprovante.usuario}</span>
            </div>
          </div>
        ) : (
          /* Imagem simulada */
          <div className="w-[380px] h-[280px] bg-gradient-to-br from-slate-200 to-slate-300 rounded shadow-xl border border-gray-200 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
            <ImageIcon size={40} className="text-slate-400" />
            <p className="text-xs text-slate-500 font-medium">{comprovante.arquivo}</p>
            <p className="text-[10px] text-slate-400">Foto de Entrega</p>
            {/* Marca d'água simulada */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <p
                className="text-[64px] font-black text-slate-300/40 uppercase tracking-widest"
                style={{ transform: "rotate(-30deg)" }}
              >
                FOTO
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Painel de Edição ─────────────────────────────────────────────────────────

interface CamposEdicao {
  tipo: string;
  dataHora: string;
  usuario: string;
  observacao: string;
}

function PainelEdicao({
  comprovante,
  onSave,
  onCancel,
}: {
  comprovante: Comprovante;
  onSave: (campos: CamposEdicao) => void;
  onCancel: () => void;
}) {
  const [campos, setCampos] = useState<CamposEdicao>({
    tipo: comprovante.tipo,
    dataHora: comprovante.dataHora,
    usuario: comprovante.usuario,
    observacao: "",
  });

  const [salvo, setSalvo] = useState(false);

  function handleSave() {
    setSalvo(true);
    setTimeout(() => {
      setSalvo(false);
      onSave(campos);
    }, 800);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Tipo de Comprovante</label>
        <select
          value={campos.tipo}
          onChange={(e) => setCampos({ ...campos, tipo: e.target.value })}
          className="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        >
          {["Canhoto", "Foto", "NF Assinada", "Declaração", "Outro"].map((op) => (
            <option key={op}>{op}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Data / Hora</label>
        <input
          type="text"
          value={campos.dataHora}
          onChange={(e) => setCampos({ ...campos, dataHora: e.target.value })}
          className="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        />
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Usuário Responsável</label>
        <input
          type="text"
          value={campos.usuario}
          onChange={(e) => setCampos({ ...campos, usuario: e.target.value })}
          className="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        />
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Observação</label>
        <textarea
          value={campos.observacao}
          onChange={(e) => setCampos({ ...campos, observacao: e.target.value })}
          rows={3}
          placeholder="Adicione uma observação..."
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="flex-1 h-8 text-xs gap-1.5 bg-[#1a3c6e] hover:bg-[#15305a] text-white"
          onClick={handleSave}
          disabled={salvo}
        >
          {salvo ? (
            <><Check size={12} /> Salvo!</>
          ) : (
            <><Save size={12} /> Salvar Alterações</>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          onClick={onCancel}
        >
          <RotateCcw size={12} />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────

function ModalComprovanteInner({
  comprovantes,
  indiceInicial = 0,
  pedidoNum,
  onClose,
}: ModalComprovanteProps) {
  const [indice, setIndice] = useState(indiceInicial);
  const [zoom, setZoom] = useState(1);
  const [rotacao, setRotacao] = useState(0);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [listaLocal, setListaLocal] = useState<Comprovante[]>(comprovantes);
  const [notificacao, setNotificacao] = useState<string | null>(null);

  const comprovante = listaLocal[indice];
  const total = listaLocal.length;

  function mostrarNotificacao(msg: string) {
    setNotificacao(msg);
    setTimeout(() => setNotificacao(null), 2500);
  }

  function handleDownload() {
    mostrarNotificacao(`Download de "${comprovante.arquivo}" iniciado.`);
  }

  function handleSave(campos: { tipo: string; dataHora: string; usuario: string; observacao: string }) {
    setListaLocal((prev) =>
      prev.map((c, i) => i === indice ? { ...c, tipo: campos.tipo, dataHora: campos.dataHora, usuario: campos.usuario } : c)
    );
    setModoEdicao(false);
    mostrarNotificacao("Comprovante atualizado com sucesso.");
  }

  function handleAnterior() {
    setIndice((i) => Math.max(0, i - 1));
    setZoom(1);
    setRotacao(0);
    setModoEdicao(false);
  }

  function handleProximo() {
    setIndice((i) => Math.min(total - 1, i + 1));
    setZoom(1);
    setRotacao(0);
    setModoEdicao(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-[900px] max-h-[90vh] overflow-hidden">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a3c6e] text-white flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold">Comprovante de Entrega</h2>
            <p className="text-blue-200 text-[11px]">Pedido {pedidoNum} &nbsp;·&nbsp; {comprovante.tipo} &nbsp;·&nbsp; {comprovante.arquivo}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Barra de ferramentas */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex-wrap">
          {/* Navegação entre comprovantes */}
          {total > 1 && (
            <div className="flex items-center gap-1 border border-gray-300 rounded overflow-hidden">
              <button
                onClick={handleAnterior}
                disabled={indice === 0}
                className="px-2 py-1 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-[11px] text-gray-600 font-medium border-x border-gray-300">
                {indice + 1} / {total}
              </span>
              <button
                onClick={handleProximo}
                disabled={indice === total - 1}
                className="px-2 py-1 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Zoom */}
          <div className="flex items-center gap-1 border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
              className="px-2 py-1 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Diminuir zoom"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 text-[11px] text-gray-600 font-medium border-x border-gray-300 min-w-[44px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="px-2 py-1 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Rotação */}
          <button
            onClick={() => setRotacao((r) => (r + 90) % 360)}
            className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-[11px] text-gray-600 hover:bg-gray-200 transition-colors"
            title="Girar 90°"
          >
            <RotateCw size={13} />
            <span>Girar</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Editar */}
            <Button
              size="sm"
              variant={modoEdicao ? "default" : "outline"}
              className={`h-7 text-xs gap-1.5 ${modoEdicao ? "bg-[#1a3c6e] text-white hover:bg-[#15305a]" : "border-gray-300 text-gray-700"}`}
              onClick={() => setModoEdicao(!modoEdicao)}
            >
              <Pencil size={12} />
              {modoEdicao ? "Editando" : "Editar"}
            </Button>

            {/* Baixar */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-blue-400 text-blue-700 hover:bg-blue-50"
              onClick={handleDownload}
            >
              <Download size={12} />
              Baixar
            </Button>
          </div>
        </div>

        {/* Corpo principal */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Preview */}
          <div className="flex-1 flex flex-col p-4 min-h-0 overflow-auto">
            <PreviewArquivo comprovante={comprovante} zoom={zoom} rotacao={rotacao} />
          </div>

          {/* Painel lateral: metadados ou edição */}
          <div className="w-60 border-l border-gray-200 bg-gray-50 flex flex-col overflow-y-auto flex-shrink-0">
            {modoEdicao ? (
              <div className="p-4">
                <p className="text-[11px] font-semibold text-gray-700 uppercase mb-3">Editar Comprovante</p>
                <PainelEdicao
                  comprovante={comprovante}
                  onSave={handleSave}
                  onCancel={() => setModoEdicao(false)}
                />
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-4">
                {/* Metadados */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Informações</p>
                  <div className="space-y-2">
                    {[
                      { label: "Tipo", value: comprovante.tipo },
                      { label: "Arquivo", value: comprovante.arquivo },
                      { label: "Data / Hora", value: comprovante.dataHora },
                      { label: "Usuário", value: comprovante.usuario },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase">{label}</p>
                        <p className="text-[11px] text-gray-700 break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista de comprovantes do pedido */}
                {total > 1 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
                      Todos os Comprovantes ({total})
                    </p>
                    <div className="flex flex-col gap-1">
                      {listaLocal.map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => { setIndice(i); setZoom(1); setRotacao(0); setModoEdicao(false); }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px] transition-colors ${
                            i === indice
                              ? "bg-[#1a3c6e] text-white"
                              : "hover:bg-gray-200 text-gray-700"
                          }`}
                        >
                          {c.arquivo.endsWith(".pdf") ? (
                            <FileText size={12} className="flex-shrink-0" />
                          ) : (
                            <ImageIcon size={12} className="flex-shrink-0" />
                          )}
                          <span className="truncate">{c.tipo}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notificação flutuante */}
        {notificacao && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-800 text-white text-[11px] px-4 py-2 rounded-full shadow-lg z-10 pointer-events-none">
            <Check size={12} className="text-green-400" />
            {notificacao}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Exportação com Portal ────────────────────────────────────────────────────

export function ModalComprovante(props: ModalComprovanteProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(<ModalComprovanteInner {...props} />, document.body);
}
