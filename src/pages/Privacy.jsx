import { CONSENT_VERSION } from '../services/authService'
import './Privacy.css'

const dataUsage = [
  {
    data: 'Nome e e-mail',
    purpose: 'Criar e acessar a conta, identificar o pedido na retirada e enviar comprovantes.',
    basis: 'Execução de contrato',
  },
  {
    data: 'Celular (opcional)',
    purpose: 'Avisar quando o pedido estiver pronto.',
    basis: 'Consentimento',
  },
  {
    data: 'Data de nascimento (opcional)',
    purpose: 'Benefícios de aniversário no programa de fidelidade.',
    basis: 'Consentimento',
  },
  {
    data: 'Histórico de pedidos',
    purpose: 'Acompanhamento de pedidos, acúmulo de pontos e relatórios internos de forma anonimizada.',
    basis: 'Execução de contrato e consentimento (fidelidade)',
  },
  {
    data: 'Dados de pagamento',
    purpose: 'Processados diretamente pelo provedor de pagamento. Guardamos apenas o status e os 4 últimos dígitos do cartão.',
    basis: 'Execução de contrato',
  },
]

const rights = [
  'Confirmar se tratamos seus dados e acessar uma cópia deles;',
  'Corrigir dados incompletos ou desatualizados;',
  'Pedir a anonimização ou exclusão de dados desnecessários;',
  'Revogar consentimentos a qualquer momento, sem prejuízo dos pedidos já feitos;',
  'Pedir a portabilidade dos seus dados;',
  'Saber com quem compartilhamos seus dados.',
]

export default function Privacy() {
  return (
    <section className="privacy-page">
      <h1>Política de Privacidade</h1>
      <p className="muted">Versão {CONSENT_VERSION} · Rede Raízes do Nordeste</p>

      <div className="card privacy-section">
        <h2>Resumo</h2>
        <p>
          Coletamos apenas os dados necessários para você fazer pedidos e, se quiser, participar do programa de
          fidelidade. Não vendemos seus dados. Você pode consultar, corrigir, exportar ou excluir seus dados e revogar
          consentimentos a qualquer momento pelo seu perfil.
        </p>
      </div>

      <div className="card privacy-section">
        <h2>Quais dados usamos e por quê</h2>
        <div className="privacy-table-wrapper">
          <table className="privacy-table">
            <thead>
              <tr>
                <th>Dado</th>
                <th>Para que usamos</th>
                <th>Base legal (LGPD)</th>
              </tr>
            </thead>
            <tbody>
              {dataUsage.map((row) => (
                <tr key={row.data}>
                  <td>{row.data}</td>
                  <td>{row.purpose}</td>
                  <td>{row.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card privacy-section">
        <h2>Compartilhamento</h2>
        <p>
          Compartilhamos dados apenas com o provedor de pagamento, para processar a cobrança, e com a unidade onde o
          pedido será retirado. Relatórios enviados à matriz usam dados agregados e anonimizados.
        </p>
      </div>

      <div className="card privacy-section">
        <h2>Por quanto tempo guardamos</h2>
        <p>
          Os dados da conta ficam guardados enquanto ela estiver ativa. Ao excluir a conta, os dados pessoais são
          apagados ou anonimizados, exceto registros que a lei obriga a manter, como dados fiscais dos pedidos.
        </p>
      </div>

      <div className="card privacy-section">
        <h2>Seus direitos</h2>
        <ul className="privacy-rights">
          {rights.map((right) => (
            <li key={right}>{right}</li>
          ))}
        </ul>
      </div>

      <div className="card privacy-section">
        <h2>Contato do encarregado (DPO)</h2>
        <p>
          Dúvidas ou pedidos sobre seus dados: <strong>privacidade@raizesdonordeste.com.br</strong>
        </p>
      </div>
    </section>
  )
}
