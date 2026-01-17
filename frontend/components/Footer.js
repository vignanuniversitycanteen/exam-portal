import Link from 'next/link';
import { GraduationCap, Mail, ShieldCheck, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 text-white pt-24 pb-12 border-t border-slate-900">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Column 1: Brand & About */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 font-black text-2xl tracking-tighter uppercase text-white">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                                <GraduationCap size={24} />
                            </div>
                            Exam Portal
                        </div>
                        <p className="text-slate-400 font-medium leading-relaxed text-sm pr-4">
                            Next-generation examination management system. Streamlining seating allocations, attendance tracking, and result processing for a seamless academic experience.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon icon={<Twitter size={18} />} href="#" />
                            <SocialIcon icon={<Linkedin size={18} />} href="#" />
                            <SocialIcon icon={<Instagram size={18} />} href="#" />
                            <SocialIcon icon={<Facebook size={18} />} href="#" />
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-emerald-500"></span>
                            Quick Links
                        </h4>
                        <ul className="space-y-4 text-sm font-semibold text-slate-400">
                            <li><FooterLink href="/" text="Home" /></li>
                            <li><FooterLink href="/live" text="Live Sessions" /></li>
                            <li><FooterLink href="/student" text="Student Search" /></li>
                            <li><FooterLink href="/admin" text="Faculty Login" /></li>
                        </ul>
                    </div>

                    {/* Column 3: Legal & Resources */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-emerald-500"></span>
                            Resources
                        </h4>
                        <ul className="space-y-4 text-sm font-semibold text-slate-400">
                            <li><FooterLink href="/terms" text="Terms & Conditions" /></li>
                            <li><FooterLink href="/privacy" text="Privacy Policy" /></li>
                            <li><FooterLink href="/guidelines" text="Examination Guidelines" /></li>
                            <li><FooterLink href="/malpractice" text="Malpractice Policy" /></li>
                        </ul>
                    </div>

                    {/* Column 4: Contact */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-emerald-500"></span>
                            Contact Us
                        </h4>
                        <ul className="space-y-5 text-sm font-medium text-slate-400">
                            <li className="flex items-start gap-3">
                                <div className="mt-1 p-1.5 rounded bg-slate-900 text-emerald-500"><MapPin size={16} /></div>
                                <span className="leading-relaxed">University Examination Cell,<br />Admin Block, Main Campus,<br />Vijayawada, India 522502</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-1.5 rounded bg-slate-900 text-emerald-500"><Phone size={16} /></div>
                                <span>+91 863 2344700</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-1.5 rounded bg-slate-900 text-emerald-500"><Mail size={16} /></div>
                                <span className="text-white">coe@university.edu</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                        &copy; {currentYear} Smart Exam Portal. All rights reserved.
                    </p>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">System Online</span>
                        </div>
                        <p className="hidden md:flex items-center gap-1.5 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                            Built with <Heart size={10} className="text-red-500 fill-current" /> by Tech Team
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialIcon({ icon, href }) {
    return (
        <a
            href={href}
            className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all duration-300 transform hover:-translate-y-1"
        >
            {icon}
        </a>
    );
}

function FooterLink({ href, text }) {
    return (
        <Link href={href} className="group flex items-center gap-2 hover:text-emerald-400 transition-colors">
            <ExternalLink size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            <span>{text}</span>
        </Link>
    );
}
