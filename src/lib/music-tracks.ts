export type MusicTrack = {
    /** Public URL under `public/` (e.g. `.mp4`, `.wav`, `.m4a`) */
    src: string;
    title: string;
    artist: string;
};

/**
 * Built-in demo uses short synthetic tones in `public/music/`.
 * Replace or extend with your own files (including `.mp4`).
 */
export const MUSIC_TRACKS: MusicTrack[] = [
    {
        src: "/music/nang_am_trong_tim.mp3",
        title: "Nắng ấm trong tim",
        artist: "DuongG, Dadeon",
    },
    {
        src: "/music/to_mau.mp3",
        title: "Tô màu",
        artist: "XIN",
    },
    {
        src: "/music/rang_khon.mp3",
        title: "Răng khôn",
        artist: "Phí Phương Anh, RIN9",
    },
    {
        src: "/music/nhung_dieu_nho_nhoi.mp3",
        title: "Những điều nhỏ nhoi",
        artist: "Ruby Dong Melodies of Soul",
    },
    {
        src: "/music/khong_bang.mp3",
        title: "Không bằng",
        artist: "Na",
    },
    {
        src: "/music/sai_gon_hom_nay_mua.mp3",
        title: "Sài Gòn hôm nay mưa",
        artist: "JSOL, Hoàng Duyên",
    },
    {
        src: "/music/yeu_em_thi_gat_dau.mp3",
        title: "Yêu em thì gật đầu",
        artist: "Lê Bảo Hân Cover",
    },
    {
        src: "/music/giua_dai_lo_dong_tay.mp3",
        title: "Giữa đại lộ đông tây",
        artist: "Uyên Linh",
    },
    {
        src: "/music/kho_ve_nu_cuoi.mp3",
        title: "Khó vẽ nụ cười",
        artist: "Đạt G, Du Uyên",
    },
];

export function getMusicTrackBySrc(src: string): MusicTrack | undefined {
    return MUSIC_TRACKS.find((track) => track.src === src);
}
