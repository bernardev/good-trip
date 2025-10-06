import { z } from "zod";

/* Banner */
export const BannerSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  ctaLabel: z.string().optional(),
  bgUrl: z.union([z.string().url(), z.literal("")]).optional(),
  textColor: z.string().optional(),        // ex: "#ffffff"
  subtitleColor: z.string().optional(),    // ex: "#e5e7eb"
  overlay: z.number().min(0).max(0.9).optional(), // 0..0.9
});

/* Header */
export const HeaderLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1), // aceita "/rota" ou "https://..."
});

export const HeaderSchema = z.object({
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  nav: z.array(HeaderLinkSchema).optional(),
});

/* Footer */
const InternalPath = z.string().regex(/^\/[^\s]*$/); // ex.: "/termos"
export const FooterSchema = z.object({
  cnpj: z.string().optional(),
  address: z.string().optional(),
  links: z.array(z.object({
    label: z.string(),
    href: z.union([z.string().url(), InternalPath]),
  })).optional(),
  socials: z.array(z.object({
    network: z.string(),
    href: z.string().url(), // sociais ficam como URL
  })).optional(),
});

/* Settings (raiz) */
export const SettingsSchema = z.object({
  banner: BannerSchema.optional(),
  header: HeaderSchema.optional(),
  footer: FooterSchema.optional(),
});

export type Banner = z.infer<typeof BannerSchema>;
export type Header = z.infer<typeof HeaderSchema>;
export type HeaderLink = z.infer<typeof HeaderLinkSchema>;
export type Footer = z.infer<typeof FooterSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

/* Presets */
export const DEFAULT_HEADER_PRESET: Header = {
  ctaLabel: "Buscar agora",
  ctaHref: "/buscar",
  phone: "",
  whatsapp: "",
  nav: [
    { label: "Quem Somos", href: "/quem-somos" },
    { label: "Passagens",  href: "/buscar" },
    { label: "Contato",    href: "/contato" },
  ],
};

export const DEFAULT_FOOTER_PRESET: Footer = {
  cnpj: "57.355.709/0001-27",
  address: "",
  links: [
    { label: "Sobre",         href: "/quem-somos" },
    { label: "Termos de uso", href: "/termos" },
    { label: "Privacidade",   href: "/privacidade" },
  ],
  socials: [
    { network: "instagram", href: "https://instagram.com/goodtrip.com.br" },
    { network: "whatsapp",  href: "https://wa.me/5593991436570" },
  ],
};

/* Defaults seguros (tipados) */
export const DEFAULT_SETTINGS: Settings = {
  banner: { title: "", subtitle: "", ctaLabel: "", bgUrl: "" },
  header: { ...DEFAULT_HEADER_PRESET },
  footer: { ...DEFAULT_FOOTER_PRESET },
};
