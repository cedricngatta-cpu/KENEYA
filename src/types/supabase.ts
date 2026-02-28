export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    role: 'citizen' | 'community_agent' | 'health_center' | 'district' | 'city_hall' | 'admin'
                    phone: string | null
                    language: string
                    org_id: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    role?: string
                    phone?: string | null
                    language?: string
                    org_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    role?: string
                    phone?: string | null
                    language?: string
                    org_id?: string | null
                }
            }
            reports: {
                Row: {
                    id: string
                    user_id: string | null
                    symptoms: Json
                    audio_url: string | null
                    geo_cell: string | null
                    severity: 'vert' | 'jaune' | 'rouge'
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    symptoms: Json
                    audio_url?: string | null
                    geo_cell?: string | null
                    severity: string
                    created_at?: string
                }
                Update: {
                    symptoms?: Json
                    severity?: string
                    geo_cell?: string | null
                }
            }
            clinical_cases: {
                Row: {
                    id: string
                    facility_id: string
                    syndrome: string
                    status: 'suspect' | 'probable' | 'confirmed'
                    tests: Json | null
                    severity: 'vert' | 'jaune' | 'rouge'
                    created_at: string
                }
                Insert: {
                    id?: string
                    facility_id: string
                    syndrome: string
                    status?: string
                    tests?: Json | null
                    severity: string
                    created_at?: string
                }
                Update: {
                    syndrome?: string
                    status?: string
                    severity?: string
                    tests?: Json | null
                }
            }
            triage_results: {
                Row: {
                    id: string
                    report_id: string
                    syndrome: string
                    level: 'vert' | 'jaune' | 'rouge'
                    recommendations: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    report_id: string
                    syndrome: string
                    level: string
                    recommendations: string
                    created_at?: string
                }
                Update: {
                    syndrome?: string
                    level?: string
                    recommendations?: string
                }
            }
            clusters: {
                Row: {
                    id: string
                    geo_cell: string
                    syndrome: string
                    time_window: '24h' | '72h' | '7j'
                    score: number
                    status: 'active' | 'resolved'
                    created_at: string
                }
                Insert: {
                    id?: string
                    geo_cell: string
                    syndrome: string
                    time_window?: string
                    score: number
                    status?: string
                    created_at?: string
                }
                Update: {
                    geo_cell?: string
                    syndrome?: string
                    score?: number
                    status?: string
                }
            }
            alerts: {
                Row: {
                    id: string
                    target_area: string
                    message_text: string
                    audio_url: string | null
                    channel: 'whatsapp' | 'sms' | 'push'
                    sent_at: string
                }
                Insert: {
                    id?: string
                    target_area: string
                    message_text: string
                    audio_url?: string | null
                    channel: string
                    sent_at?: string
                }
                Update: {
                    target_area?: string
                    message_text?: string
                    channel?: string
                }
            }
            aid_requests: {
                Row: {
                    id: string
                    type: 'transport' | 'kits' | 'mobile_team'
                    requester_id: string
                    status: 'pending' | 'assigned' | 'resolved'
                    assigned_team: string | null
                    proof_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    type: string
                    requester_id: string
                    status?: string
                    assigned_team?: string | null
                    proof_url?: string | null
                    created_at?: string
                }
                Update: {
                    status?: string
                    assigned_team?: string | null
                    proof_url?: string | null
                }
            }
            symptom_catalog: {
                Row: {
                    id: string
                    label_fr: string
                    icon_name: string
                    translations: Json
                    audio_prompts: Json
                }
                Insert: {
                    id?: string
                    label_fr: string
                    icon_name: string
                    translations: Json
                    audio_prompts: Json
                }
                Update: {
                    label_fr?: string
                    icon_name?: string
                    translations?: Json
                    audio_prompts?: Json
                }
            }
            system_config: {
                Row: {
                    key: string
                    value: string
                    updated_at: string
                }
                Insert: {
                    key: string
                    value: string
                    updated_at?: string
                }
                Update: {
                    value?: string
                    updated_at?: string
                }
            }
        }
    }
}
