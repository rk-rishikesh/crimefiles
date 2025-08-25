export type Suspect = {
    id: string;
    name: string;
    description?: string;
};

export type CaseFile = {
    id: string;
    title: string;
    excerpt: string;
    story: string;
    hints: string[];
    suspects: Suspect[];
};

const cases: CaseFile[] = [
    {
        id: "1",
        title: "The Missing Ledger",
        excerpt:
            "On the eve of an audit, the finance vault’s master ledger vanished without a trace.",
        story:
            "At 07:12, the finance team discovered the encrypted master ledger missing from the vault minutes before audit prep. The vault remained online; no intrusion alarms fired, and the recovery key register shows no rotation. Access telemetry highlights three unique user contexts interacting with the vault this week. The file’s last known state: locked, consistent checksum, and no partial download artifacts. The CFO requested a dry-run export yesterday; the IT Admin migrated the vault to hardware-token-only access two days earlier; and a new intern assisted with report formatting. Yet the audit folder shows a phantom rename event with no corresponding user agent. Someone knew exactly how to look ordinary while doing something extraordinary.",
        hints: [
            "Late-night VPN session overlaps with the vault’s access window by 17 minutes.",
            "Hardware token enrollment changed for one account; the old token wasn’t decommissioned.",
            "Helpdesk ticket about a coffee spill was filed at 08:03 referencing a disabled USB hub.",
            "Audit dry-run export was requested but never completed—logs show a cancelled job.",
            "The phantom rename used a locale rarely set in the company (en-GB).",
            "Checksum history indicates the ledger wasn’t modified—only moved or hidden.",
        ],
        suspects: [
            { id: "s1", name: "CFO", description: "Holds final sign-off on audits." },
            {
                id: "s2",
                name: "IT Administrator",
                description: "Migrated the vault to hardware-token-only access this week.",
            },
            { id: "s3", name: "Finance Intern", description: "New to process; assisted with formatting exports." },
        ],
    },
    {
        id: "2",
        title: "Midnight Intrusion",
        excerpt:
            "At 02:14 the R&D lab door opened with no badge swipe—and cameras showed an empty hall.",
        story:
            "The secure lab logs an access event at 02:14, yet the camera stream displays a blank frame and the hallway remains still. Maintenance finished earlier that evening; systems reported nominal. Inside, a prototype torque driver sits precisely 12 cm off its taped outline, the sort of shift a careful hand would make to test balance—then leave everything else untouched. The door sensor wasn’t faulted, and the audit trail lists a normal unlock action with a valid session, but no identity. A guard on rounds reported a ‘quiet corridor’ at 02:10. By sunrise, engineering counted tools, re-armed sensors, and argued about magnets, firmware, and who knew the camera’s blind refresh.",
        hints: [
            "Security console entered silent mode from 02:10–02:20, suppressing motion alerts.",
            "A known camera firmware ‘refresh’ bug can blank overlays exactly at the 14th minute.",
            "Door contacts can be tricked by a properly placed rare-earth magnet.",
            "Key locker shows one ‘temporary’ master key signed out yesterday with no return yet.",
            "Guard route scan missed a checkpoint at 02:12; justification: ‘unexpected detour’.",
            "A former employee’s VPN token pinged from near the site at 01:57 for 4 minutes.",
            "Operations manager keeps a meticulous tool log; the 12 cm shift matches their notes.",
        ],
        suspects: [
            { id: "s1", name: "Night Security Guard", description: "Knows patrol timings and how to quiet alerts." },
            { id: "s2", name: "Ex-Employee with Temp Access", description: "Had vendor access last quarter; knows legacy quirks." },
            { id: "s3", name: "Operations Manager", description: "Obsessive about placement; owns the tool inventory process." },
        ],
    },
    {
        id: "3",
        title: "The Phantom Transfer",
        excerpt:
            "Minutes after the new treasury went live, funds ghosted through an intermediary and into a mixer.",
        story:
            "Internal chat announced a fresh treasury address; five minutes later, a sizeable transfer executed through a brand-new wallet and settled into a popular mixer with near-perfect fee timing. The path mirrors a months-old ‘dry run’ from an internal test environment—right down to the gas strategy and batching interval. The intermediate wallet was funded moments before, received exactly one inbound, and then zeroed out. Logs suggest the signer policy was correct, yet the broadcast timestamp lines up with a maintenance window proposal that never shipped. Someone anticipated the reveal, rehearsed the path, and let mempool mechanics do the rest.",
        hints: [
            "Gas price followed a percentile strategy used in the team’s test scripts.",
            "The intermediary wallet’s funding came from an exchange deposit with an unusual memo pattern.",
            "Treasury policy audit notes recommended a 10-minute grace after announcements.",
            "Node fingerprint for the broadcast matches a common dev machine configuration.",
            "A hardware signer was checked out for 24 hours this week—exactly straddling the go-live.",
            "The transfer nonce and batching cadence mirror an internal CI ‘canary’ job from spring.",
        ],
        suspects: [
            { id: "s1", name: "Protocol Developer", description: "Authored tooling for testnet dry runs and gas strategies." },
            { id: "s2", name: "Multisig Signer", description: "Has policy knowledge and limited-window signer custody." },
            { id: "s3", name: "External Contractor", description: "Handled prior audit; familiar with timing and CI pipelines." },
        ],
    },
];

export const getCases = (): CaseFile[] => cases;

export const getCaseById = (id: string): CaseFile | undefined =>
    cases.find((c) => c.id === id);



