'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { MultiSelect } from 'primereact/multiselect';
import { useState } from 'react';

import onboardingActions from '@/actions/onboarding';

const allBanks: { label: string; value: string }[] = [
  { label: 'Banco ABC Brasil (246)', value: '246' },
  { label: 'Banco Alfa (025)', value: '025' },
  { label: 'Banco AndBank Brasil (065)', value: '065' },
  { label: 'Banco Arbi (213)', value: '213' },
  { label: 'Banco BMG (318)', value: '318' },
  { label: 'Banco BNP Paribas Brasil (752)', value: '752' },
  { label: 'Banco BTG Pactual (208)', value: '208' },
  { label: 'Banco Banestes (021)', value: '021' },
  { label: 'Banco Bradesco BBI (036)', value: '036' },
  { label: 'Banco Bradesco BERJ (122)', value: '122' },
  { label: 'Banco Bradesco Financiamentos (394)', value: '394' },
  { label: 'Banco BS2 (218)', value: '218' },
  { label: 'Banco C6 Bank (336)', value: '336' },
  { label: 'Banco Caixa Econômica Federal (104)', value: '104' },
  { label: 'Banco Cedula (266)', value: '266' },
  { label: 'Banco Citibank (745)', value: '745' },
  { label: 'Banco Clássico (241)', value: '241' },
  { label: 'Banco Cooperativo Sicredi (748)', value: '748' },
  { label: 'Banco Cooperativo Sicoob (756)', value: '756' },
  { label: 'Banco Credialiança Cooperativa de Crédito (098)', value: '098' },
  { label: 'Banco Crefisa (069)', value: '069' },
  { label: 'Banco Daycoval (707)', value: '707' },
  { label: 'Banco de la Nación Argentina (300)', value: '300' },
  { label: 'Banco Deutsche Bank (487)', value: '487' },
  { label: 'Banco do Estado de Sergipe (047)', value: '047' },
  { label: 'Banco do Estado do Pará (037)', value: '037' },
  { label: 'Banco do Estado do Rio Grande do Sul (041)', value: '041' },
  { label: 'Banco do Nordeste (004)', value: '004' },
  { label: 'Banco Fibra (224)', value: '224' },
  { label: 'Banco Fator (265)', value: '265' },
  { label: 'Banco Genial (125)', value: '125' },
  { label: 'Banco Guanabara (612)', value: '612' },
  { label: 'Banco Industrial do Brasil (604)', value: '604' },
  { label: 'Banco Investcred Unibanco (249)', value: '249' },
  { label: 'Banco KEB Hana do Brasil (757)', value: '757' },
  { label: 'Banco Luso Brasileiro (600)', value: '600' },
  { label: 'Banco Magnum Sociedade de Crédito Direto (511)', value: '511' },
  { label: 'Banco Master (243)', value: '243' },
  { label: 'Banco Mercantil do Brasil (389)', value: '389' },
  { label: 'Banco Modal (746)', value: '746' },
  { label: 'Banco MUFG Brasil (456)', value: '456' },
  { label: 'Banco Original (212)', value: '212' },
  { label: 'Banco Pan (623)', value: '623' },
  { label: 'Banco Paulista (611)', value: '611' },
  { label: 'Banco Pine (643)', value: '643' },
  { label: 'Banco Rendimento (633)', value: '633' },
  { label: 'Banco Rodobens (120)', value: '120' },
  { label: 'Banco Safra (422)', value: '422' },
  { label: 'Banco Semear (743)', value: '743' },
  { label: 'Banco Société Générale Brasil (366)', value: '366' },
  { label: 'Banco Sofisa (637)', value: '637' },
  { label: 'Banco Topázio (082)', value: '082' },
  { label: 'Banco Tricury (018)', value: '018' },
  { label: 'Banco UBS (505)', value: '505' },
  { label: 'Banco Votorantim (655)', value: '655' },
  { label: 'Bank of America Merrill Lynch Brasil (755)', value: '755' },
  { label: 'Bank of China (Brasil) (320)', value: '320' },
  { label: 'BRB - Banco de Brasília (070)', value: '070' },
  { label: 'Citibank N.A. (477)', value: '477' },
  { label: 'Cooperativa Central de Crédito Ailos (085)', value: '085' },
  { label: 'Cooperativa de Crédito Rural Coopavel (281)', value: '281' },
  { label: 'Cooperativa de Crédito Rural Seara - Crediseara (430)', value: '430' },
  { label: 'Cresol Confederação (133)', value: '133' },
  { label: 'Credicoamo Crédito Rural Cooperativa (010)', value: '010' },
  { label: 'Credisan Cooperativa de Crédito (089)', value: '089' },
  { label: 'Delcred Sociedade de Crédito Direto (435)', value: '435' },
  { label: 'Lar Cooperativa de Crédito - Lar Credi (421)', value: '421' },
  { label: 'Neon (735)', value: '735' },
  { label: 'Novo Banco Continental (753)', value: '753' },
  { label: 'PagBank (290)', value: '290' },
  { label: 'Sulcredi/Crediluz (322)', value: '322' },
  { label: 'Sisprime do Brasil - Cooperativa de Crédito (084)', value: '084' },
  { label: 'Unicred do Brasil (136)', value: '136' },
  { label: 'Uniprime Central Nacional (099)', value: '099' },
];

const mainBanks: { name: string; logo: string; code: string }[] = [
  { name: 'Nubank', logo: '/logos/nubank.png', code: '260' },
  { name: 'Itaú', logo: '/logos/itau.png', code: '341' },
  { name: 'Bradesco', logo: '/logos/bradesco.png', code: '237' },
  { name: 'Banco do Brasil', logo: '/logos/bb.png', code: '001' },
  { name: 'Santander', logo: '/logos/santander.png', code: '033' },
  { name: 'Caixa', logo: '/logos/caixa.png', code: '104' },
  { name: 'BTG', logo: '/logos/btg.png', code: '208' },
  { name: 'Inter', logo: '/logos/inter.png', code: '077' },
  { name: 'Safra', logo: '/logos/safra.png', code: '422' },
  { name: 'C6 Bank', logo: '/logos/c6.png', code: '336' },
];

// eslint-disable-next-line max-lines-per-function
export default function OnboardingStep3() {
  const router = useRouter();
  const [selectedMainBanks, setSelectedMainBanks] = useState<string[]>([]);
  const [showOtherBanks, setShowOtherBanks] = useState(false);
  const [selectedOtherBanks, setSelectedOtherBanks] = useState<string[]>([]);

  const toggleMainBank = (bankName: string) => {
    if (selectedMainBanks.includes(bankName)) {
      setSelectedMainBanks(selectedMainBanks.filter((b) => b !== bankName));
    } else {
      setSelectedMainBanks([...selectedMainBanks, bankName]);
    }
  };

  const handleContinue = async () => {
    // Get bank codes from main banks
    const mainBankCodes = selectedMainBanks
      .map((bankName) => mainBanks.find((bank) => bank.name === bankName)?.code)
      .filter(Boolean) as string[];

    // Combine with other bank codes
    const selectedBankCodes = [...mainBankCodes, ...selectedOtherBanks];
    const hasNubank = selectedBankCodes.includes('260');
    const onlyNubank = selectedBankCodes.length === 1 && hasNubank;

    // Save selected banks
    const onboardingUid = localStorage.getItem('onboardingUid');
    if (!onboardingUid) {
      return;
    }

    await onboardingActions.updateOnboarding(onboardingUid, {
      banks: selectedBankCodes,
      step: 3,
    });

    if (onlyNubank) {
      // Caso apenas Nubank → segue
      router.push('/onboarding/step4');
    } else if (hasNubank) {
      // Nubank + outros → confirmar
      confirmDialog({
        message:
          'Atualmente só suportamos Nubank. A maioria das suas movimentações está no Nubank?',
        header: 'Confirmação',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, quero continuar',
        rejectLabel: 'Não, quero entrar na lista de espera',
        accept: async () => {
          await onboardingActions.updateOnboarding(onboardingUid, {
            step: 4,
          });
          router.push('/onboarding/step4');
        },
        reject: () => router.push('/onboarding/waitlist'),
      });
    } else {
      // Nenhum Nubank → informar e sugerir lista de espera
      confirmDialog({
        message:
          'Infelizmente ainda não suportamos os bancos selecionados. Quer entrar na nossa lista de espera?',
        header: 'Aviso',
        icon: 'pi pi-info-circle',
        acceptLabel: 'Sim, quero ser avisado',
        rejectLabel: 'Não, obrigado',
        accept: () => router.push('/onboarding/waitlist'),
        reject: () => router.push('/onboarding/decline'),
      });
    }
  };

  return (
    <>
      <ConfirmDialog />

      <h2 className="text-xl font-semibold mb-6 text-center">
        Quais bancos você usa no dia a dia?
      </h2>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
        {mainBanks.map((bank) => (
          <div
            key={bank.name}
            className={`border rounded-lg p-2 flex flex-col items-center cursor-pointer transition
            ${selectedMainBanks.includes(bank.name) ? 'border-primary bg-primary/20' : 'border-gray-300 bg-white'}`}
            onClick={() => toggleMainBank(bank.name)}
          >
            <div className="w-12 h-12 relative mb-2">
              <Image src={bank.logo} alt={bank.name} fill className="object-contain" />
            </div>
            <div className="text-xs text-gray-700 text-center">{bank.name}</div>
          </div>
        ))}
        <div
          className={`border rounded-lg p-2 flex flex-col items-center cursor-pointer transition
          ${showOtherBanks ? 'border-primary bg-primary/20' : 'border-gray-300 bg-white'}`}
          onClick={() => setShowOtherBanks(!showOtherBanks)}
        >
          <div className="w-12 h-12 flex items-center justify-center mb-2 text-2xl">➕</div>
          <div className="text-xs text-gray-700 text-center">Outro</div>
        </div>
      </div>

      {showOtherBanks && (
        <div className="w-full max-w-md mb-8">
          <label className="block text-sm text-gray-600 mb-2">Escolha seus bancos adicionais</label>
          <MultiSelect
            value={selectedOtherBanks}
            onChange={(e) => setSelectedOtherBanks(e.value)}
            options={allBanks}
            optionLabel="label"
            placeholder="Selecione"
            display="chip"
            filter
            className="w-full"
          />
        </div>
      )}

      <div className="w-full max-w-md">
        <Button
          label="Continuar"
          className="w-full"
          disabled={selectedMainBanks.length === 0 && selectedOtherBanks.length === 0}
          onClick={handleContinue}
        />
      </div>
    </>
  );
}
