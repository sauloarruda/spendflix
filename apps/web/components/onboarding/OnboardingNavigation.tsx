import { usePathname, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

type OnboardingNavigationProps = {
  disabled?: boolean;
  onClick: () => void;
};

export default function OnboardingNavigation({ disabled, onClick }: OnboardingNavigationProps) {
  const path = usePathname();
  const currentStep = Number(path.slice(-1));
  const router = useRouter();

  function handleBackClick(event: React.MouseEvent<HTMLButtonElement>) {
    const button = event.target as HTMLButtonElement;
    button.disabled = true;
    router.push(`/onboarding/step${currentStep - 1}`);
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const button = event.target as HTMLButtonElement;
    button.disabled = true;
    return onClick();
  }

  return (
    <div className="w-full flex mt-4 gap-1 max-w-md mx-auto">
      {currentStep > 1 && (
        <Button severity="info" icon="pi pi-arrow-left" onClick={handleBackClick} />
      )}
      <Button label="Continuar" className="grow-1" onClick={handleClick} disabled={disabled} />
    </div>
  );
}
