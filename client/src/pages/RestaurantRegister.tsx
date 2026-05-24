import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, ChevronLeft, Utensils, MapPin, Phone, Globe, Instagram } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "fine_dining", label: "Fine Dining" },
  { value: "casual", label: "Casual" },
  { value: "bar", label: "Bar" },
  { value: "cafe", label: "Café" },
  { value: "pizzeria", label: "Pizzaria" },
  { value: "sushi", label: "Sushi" },
  { value: "churrascaria", label: "Churrascaria" },
  { value: "vegano", label: "Vegano" },
  { value: "fast_food", label: "Fast Food" },
  { value: "internacional", label: "Internacional" },
  { value: "outros", label: "Outros" },
];

const PRICE_RANGES = [
  { value: "$", label: "$ — Econômico" },
  { value: "$$", label: "$$ — Moderado" },
  { value: "$$$", label: "$$$ — Caro" },
  { value: "$$$$", label: "$$$$ — Muito Caro" },
];

export default function RestaurantRegisterPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    name: "",
    description: "",
    cuisine: "",
    category: "casual",
    address: "",
    neighborhood: "",
    phone: "",
    website: "",
    instagramHandle: "",
    priceRange: "$$",
  });

  const register = trpc.restaurants.register.useMutation({
    onSuccess: () => {
      toast.success("Restaurante cadastrado com sucesso!");
      navigate("/restaurant/dashboard");
    },
    onError: (e) => toast.error(e.message || "Erro ao cadastrar restaurante."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }
    register.mutate(form as any);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Faça login para continuar</h2>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">Entrar</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="container flex items-center h-14">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          </Link>
          <span className="font-display text-lg font-bold text-gradient mx-auto">Tastee</span>
          <div className="w-20" />
        </div>
      </div>

      <div className="container max-w-xl py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Cadastrar Restaurante</h1>
          <p className="text-muted-foreground">Comece a receber avaliações em vídeo dos seus clientes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Utensils className="w-4 h-4 text-primary" /> Informações Básicas
            </h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do Restaurante *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Restaurante do João"
                required
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descreva seu restaurante, especialidades, ambiente..."
                rows={3}
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Faixa de Preço</label>
                <select
                  value={form.priceRange}
                  onChange={(e) => setForm((p) => ({ ...p, priceRange: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PRICE_RANGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo de Culinária</label>
              <input
                value={form.cuisine}
                onChange={(e) => setForm((p) => ({ ...p, cuisine: e.target.value }))}
                placeholder="Ex: Italiana, Brasileira, Japonesa..."
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Localização
            </h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Endereço</label>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Rua, número, complemento"
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Bairro</label>
              <input
                value={form.neighborhood}
                onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                placeholder="Ex: Pinheiros, Itaim Bibi..."
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Contato & Redes Sociais
            </h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Website</label>
              <input
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://seurestaurante.com.br"
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Instagram</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  value={form.instagramHandle}
                  onChange={(e) => setForm((p) => ({ ...p, instagramHandle: e.target.value.replace("@", "") }))}
                  placeholder="seurestaurante"
                  className="w-full pl-8 pr-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!form.name.trim() || register.isPending}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {register.isPending ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Cadastrando...</>
            ) : (
              <><Building2 className="w-5 h-5" /> Cadastrar Restaurante</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
