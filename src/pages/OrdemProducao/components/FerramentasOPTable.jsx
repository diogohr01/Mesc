import { Table } from 'antd';
import React, { useMemo } from 'react';

const columns = [
  { title: 'OP', dataIndex: 'op', key: 'op', width: 100 },
  { title: 'Código da Ferramenta', dataIndex: 'codigoFerramenta', key: 'codigoFerramenta', width: 150 },
  { title: 'NC', dataIndex: 'nc', key: 'nc', width: 80, align: 'right', render: (v) => v ?? '-' },
  { title: 'NB', dataIndex: 'nb', key: 'nb', width: 80, align: 'right', render: (v) => v ?? '-' },
  { title: 'Puxada', dataIndex: 'puxada', key: 'puxada', width: 100, align: 'right', render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-') },
  { title: 'Billet', dataIndex: 'billet', key: 'billet', width: 100, align: 'right', render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-') },
  { title: 'NP', dataIndex: 'np', key: 'np', width: 80, align: 'right', render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-') },
  { title: 'NPR', dataIndex: 'npr', key: 'npr', width: 80, align: 'right', render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-') },
];

const FerramentasOPTable = ({ ordemData }) => {
  const dataSource = useMemo(() => {
    if (!ordemData) return [];
    const ferramentas = ordemData.ferramentas;
    if (Array.isArray(ferramentas) && ferramentas.length > 0) {
      return ferramentas.map((row, idx) => ({ ...row, key: `ferr-${idx}` }));
    }
    const op = ordemData.numeroOPERP || ordemData.id;
    const f = ordemData.ferramenta || {};
    return [
      {
        key: 'ferr-0',
        op,
        codigoFerramenta: f.codigo || '',
        nc: ordemData.numeroCortes,
        nb: ordemData.numeroBillets,
        puxada: ordemData.puxada,
        billet: ordemData.tamanhoBillet,
        np: ordemData.numeroPecasOP,
        npr: ordemData.rendimentoMetalico,
      },
    ];
  }, [ordemData]);

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }}
      bordered
    />
  );
};

export default FerramentasOPTable;
