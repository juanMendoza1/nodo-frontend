import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Server, Building2, Layers } from 'lucide-react';

import { suscripcionesService } from '../../../api/suscripciones.service';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import { conceptosService } from '../../../api/conceptos.service';
import { empresasService } from '../../../api/empresas.service';
import { ciclosService } from '../../../api/ciclos.service';

// Importamos los hijos refactorizados
import FacturacionIndividual from '../components/FacturacionIndividual';
import FacturacionMasiva from '../components/FacturacionMasiva';

export default function FacturacionSaaS() {
  const NODO_MASTER_ID = 1;
  const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'MASIVO'>('INDIVIDUAL');

  // FETCHING GLOBAL
  const { data: initData, isLoading: loadingInit } = useQuery({
    queryKey: ['facturacion_init'],
    queryFn: async () => {
      const [subsRes, empsRes, ciclosRes] = await Promise.all([
        suscripcionesService.obtenerTodas(), 
        empresasService.obtenerTodas(), 
        ciclosService.obtenerTodos()
      ]);
      return { 
        suscripciones: (subsRes || []).filter((s: any) => s.activo), 
        empresasFull: empsRes || [], 
        ciclos: ciclosRes || [] 
      };
    }
  });
  
  const { data: plantillasData, isLoading: loadingPlantillas } = useQuery({
    queryKey: ['plantillas_transversales'],
    queryFn: async () => {
      const [liqs, conceptos] = await Promise.all([
        liquidacionesService.obtenerTodas(), 
        conceptosService.obtenerDisponibles(NODO_MASTER_ID, 0)
      ]);
      return { 
        liquidaciones: liqs || [], 
        conceptosManuales: (conceptos || []).filter((c: any) => c.tipoCalculo !== 'FORMULA') 
      };
    }
  });

  const isLoadingUI = loadingInit || loadingPlantillas;
  const globalData = { initData, plantillasData };

  // COMPONENTE TAB SWITCHER (Pasado como prop a los hijos para mantener el diseño)
  const TabSwitcher = (
    <div className="bg-zinc-100 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-zinc-200/60">
      <button 
        onClick={() => setActiveTab('INDIVIDUAL')} 
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'INDIVIDUAL' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
      >
        <Building2 className="w-4 h-4" /> Individual
      </button>
      <button 
        onClick={() => setActiveTab('MASIVO')} 
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'MASIVO' ? 'bg-black text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
      >
        <Layers className="w-4 h-4" /> Masivo (Lote)
      </button>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
            <Server className="w-8 h-8 text-black" /> Motor de Facturación SaaS
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Liquida y emite facturas de acuerdo al ciclo y fechas habilitadas en el calendario.</p>
        </div>
      </div>

      {/* RENDERIZADO DE VISTAS HIJAS */}
      {activeTab === 'INDIVIDUAL' ? (
         <FacturacionIndividual 
            data={globalData} 
            isLoadingUI={isLoadingUI} 
            TabSwitcher={TabSwitcher} 
         />
      ) : (
         <FacturacionMasiva 
            data={globalData} 
            isLoadingUI={isLoadingUI} 
            TabSwitcher={TabSwitcher} 
         />
      )}
    </div>
  );
}