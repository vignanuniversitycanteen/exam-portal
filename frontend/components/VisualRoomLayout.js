'use client';
import { Monitor, MapPin } from 'lucide-react';

export default function VisualRoomLayout({ layout, targetSeat }) {
    if (!layout || !targetSeat) return null;

    const { room, seats } = layout;

    // Create reversed grid mapping (matching Admin View orientation)
    const grid = [];
    for (let r = 0; r < room.rows; r++) {
        const row = [];
        for (let c = 0; c < room.cols; c++) {
            const dbR = r + 1;
            const dbC = c + 1;
            const assignment = seats.find(s => s.row === dbR && s.col === dbC);
            const isTarget = dbR === targetSeat.row && dbC === targetSeat.col;
            const isBlocked = room.disabled_seats?.includes(`${dbR}-${dbC}`);
            row.push({ dbR, dbC, assignment, isTarget, isBlocked });
        }
        grid.push(row);
    }

    return (
        <div className="flex flex-col items-center gap-2 w-full p-2 md:p-4 bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 relative">
            {/* Subtle Gradient Header */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <div className="w-full overflow-x-auto pb-4 custom-scrollbar px-1">
                <div className="w-fit mx-auto min-w-full md:min-w-0">
                    {/* Column Headers */}
                    <div className="flex flex-row-reverse gap-0.5 md:gap-0.5 mb-0.5">
                        {/* Spacer for Row Labels */}
                        <div className="w-3 md:w-5 ml-0.5 shrink-0"></div>
                        {Array.from({ length: room.cols }).map((_, c) => {
                            const isAisleGap = room.aisle_interval > 0 && ((c + 1) % room.aisle_interval === 0) && (c + 1) !== room.cols;
                            return (
                                <div key={c} className={`w-3 h-3 md:w-5 md:h-3 flex items-center justify-center text-[6px] md:text-[7px] font-bold text-slate-300 transition-colors ${isAisleGap ? 'ml-1.5 md:ml-3' : ''}`}>
                                    {c + 1}
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid Row Container - Reversed to match Admin Orientation */}
                    <div className="flex flex-col-reverse gap-0.5 md:gap-0.5">
                        {grid.map((row, r) => (
                            <div key={r} className="flex flex-row-reverse gap-0.5 md:gap-0.5 items-center group">
                                {/* Row Label */}
                                <div className="w-3 md:w-5 flex items-center justify-center text-[7px] md:text-[8px] font-bold text-slate-300 ml-0.5 group-hover:text-indigo-400 transition-colors">
                                    {String.fromCharCode(65 + r)}
                                </div>

                                {row.map((cell, c) => {
                                    const isAisleGap = room.aisle_interval > 0 && ((c + 1) % room.aisle_interval === 0) && (c + 1) !== room.cols;

                                    // Image Match Style Logic
                                    let style = "bg-white border-slate-200 text-slate-300 hover:border-slate-300";
                                    let content = null;

                                    if (cell.isBlocked) {
                                        // BLOCKED SEAT
                                        style = "bg-red-50 border-red-100/30 text-red-200 cursor-not-allowed opacity-30";
                                        content = <span className="text-[4px] rotate-45 select-none">/</span>;
                                    } else if (cell.isTarget) {
                                        // Highlighted Target Seat
                                        style = "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-100 z-10 scale-110 ring-1 ring-indigo-500/20";
                                        content = <span className="text-[5px] md:text-[6px] font-bold tracking-tighter select-none">{targetSeat.student_reg.slice(-3)}</span>;
                                    } else if (cell.assignment) {
                                        // occupied but not target
                                        style = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                                        content = <span className="text-[5px] md:text-[5px] font-bold tracking-tighter select-none">{cell.assignment.student_reg.slice(-3)}</span>;
                                    }

                                    return (
                                        <div
                                            key={c}
                                            className={`w-3 h-3 md:w-5 md:h-5 rounded-[1px] md:rounded-[2px] border-[0.5px] flex items-center justify-center transition-all duration-300 relative ${isAisleGap ? 'ml-1.5 md:ml-3' : ''} ${style}`}
                                        >
                                            {content}

                                            {/* Target Seat Locator Animation */}
                                            {cell.isTarget && (
                                                <div className="absolute inset-0 rounded-[1px] md:rounded-[2px] animate-ping-slow pointer-events-none ring-1 ring-indigo-500/30"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* orientation: Smart Screen / Stage Visual - ULTRA LOW PROFILE */}
            <div className="w-full max-w-[80px] md:max-w-[120px] mt-1 relative opacity-30">
                <div className="relative w-full h-3 md:h-4 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-slate-50 border-b-[0.5px] border-slate-200 rounded-[1px]"
                        style={{
                            perspective: '150px',
                            transform: 'rotateX(-20deg) scale(0.9)',
                            boxShadow: '0 -1px 5px -5px rgba(0,0,0,0.01)'
                        }}
                    ></div>
                    <span className="relative z-10 text-[5px] md:text-[6px] font-black text-slate-400 uppercase tracking-[0.1em]">
                        Screen
                    </span>
                </div>
            </div>

            {/* Ultra Compact Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-2 border-t border-slate-100 w-full">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    <span className="text-[7px] font-bold text-slate-500 uppercase">Focus</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-100"></div>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">Occupied</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full border border-slate-200 bg-white"></div>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">Empty</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-100 opacity-50"></div>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">Blocked</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes ping-slow {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                .animate-ping-slow {
                    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f8fafc;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
