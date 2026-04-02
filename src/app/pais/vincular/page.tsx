import VincularResponsavelForm from './vincular-form'

export default function PaisVincularPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center p-6">
      <div className="w-full">
        <h1 className="mb-2 text-2xl font-semibold">Vincular conta de responsável</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Para acessar o app Esportes Academy como responsavel, vincule sua conta ao cadastro ja criado pela escola.
        </p>
        <VincularResponsavelForm />
      </div>
    </div>
  )
}
