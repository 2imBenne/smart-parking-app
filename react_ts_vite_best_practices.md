# BẢN NGUYÊN TẮC VÀ TIÊU CHUẨN LẬP TRÌNH (CODING STANDARDS & BEST PRACTICES)

## DỰ ÁN: REACT + TYPESCRIPT + VITE (ENTERPRISE-GRADE)

Tài liệu này tổng hợp toàn bộ các nguyên tắc lập trình, kiến trúc thư mục, quy tắc viết code, bảo mật, và tối ưu hóa hiệu năng được áp dụng đồng bộ cho dự án. Mọi thành viên phát triển đều phải tuân thủ nghiêm ngặt các nguyên tắc dưới đây.

> **Nguồn tham khảo**: Clean Code (Robert C. Martin), React Official Docs, TypeScript Handbook, Airbnb JavaScript Style Guide, Google TypeScript Style Guide, Kent C. Dodds Patterns, Bulletproof React Architecture.

---

## Ⅰ. NGUYÊN TẮC VÀNG (GOLDEN RULES - CẤM VI PHẠM)

- **KHÔNG BAO GIỜ dùng `any`** — luôn sử dụng các kiểu dữ liệu generic, định nghĩa type/interface cụ thể hoặc dùng `unknown` kết hợp kiểm tra kiểu (Type Narrowing).
- **KHÔNG dùng `@ts-ignore` hoặc `@ts-expect-error`** — luôn tìm cách giải quyết lỗi TypeScript đúng phương pháp.
- **KHÔNG dùng `var`** — chỉ sử dụng `const` (ưu tiên hàng đầu) hoặc `let` (chỉ khi giá trị cần thay đổi).
- **KHÔNG dùng `==`** — luôn sử dụng toán tử so sánh tuyệt đối `===` và `!==` để tránh ép kiểu tự động sai lệch.
- **KHÔNG dùng `?.` (Optional Chaining) vô tội vạ** — phải chủ động kiểm tra điều kiện (validation) rõ ràng tại đầu hàm/component để giải quyết rủi ro dữ liệu rỗng và hiển thị thông báo lỗi thân thiện cho người dùng.
- **KHÔNG để lại code thừa, comment thừa, `console.log`** — dọn dẹp sạch sẽ trước khi tạo Pull Request và cấu hình loại bỏ log tự động trong production build.
- **KHÔNG dùng Inline Style** — luôn viết CSS Modules, Tailwind CSS, hoặc styled-components để tách biệt giao diện và logic.
- **KHÔNG dùng index của mảng làm `key`** khi render danh sách động — bắt buộc sử dụng Unique ID (UUID hoặc cơ sở dữ liệu ID) để tối ưu thuật toán Reconciliation của Virtual DOM.
- **KHÔNG viết Component vượt quá 200 dòng** — nếu component quá lớn, bắt buộc phải phân tách thành các component con (sub-components) chuyên biệt.
- **KHÔNG đột biến trạng thái (Mutate State) trực tiếp** — luôn cập nhật state thông qua cơ chế Immutable (sử dụng toán tử spread `...` hoặc Immer library).
- **KHÔNG viết `useEffect` không có Dependency Array** — (trừ trường hợp cố ý và có comment giải thích lý do cụ thể).
- **KHÔNG gọi Hooks trong vòng lặp, điều kiện, hoặc hàm lồng nhau** — Hooks phải luôn được gọi ở top-level của function component để đảm bảo thứ tự gọi nhất quán giữa các lần render (Rules of Hooks).
- **KHÔNG disable ESLint rules bằng comment** (ví dụ: `// eslint-disable-next-line`) — nếu ESLint báo lỗi, hãy sửa đúng cách thay vì tắt rule. Nếu bắt buộc phải disable, phải kèm comment giải thích lý do cụ thể và được review bởi team lead.
- **KHÔNG sử dụng `dangerouslySetInnerHTML` với dữ liệu chưa qua sanitize** — luôn escape hoặc dùng thư viện sanitize (DOMPurify) trước khi render HTML từ nguồn bên ngoài.
- **BẮT BUỘC toàn bộ các thông báo trả về cho người dùng đều phải là tiếng Việt có dấu** (bao gồm thông báo lỗi, thông báo thành công, thông báo toast, nội dung modal, các thông điệp validation của form, placeholder, v.v.). Tuyệt đối không sử dụng tiếng Anh hoặc tiếng Việt không dấu ở các vị trí giao tiếp với người dùng cuối.
- **BẮT BUỘC toàn bộ màu sắc sử dụng trong hệ thống đều phải sử dụng bảng màu root (CSS Custom Properties) định nghĩa trong `index.css`** (ví dụ: `var(--primary)`, `var(--danger)`, `var(--success)`, v.v.). Tuyệt đối cấm sử dụng các mã màu hex, rgb hoặc tên màu cố định (hardcoded colors) trực tiếp trong các file CSS của các component hoặc trang riêng lẻ để đảm bảo tính đồng bộ thẩm mỹ và hỗ trợ chế độ Light/Dark Mode hoàn hảo.

---

## 1. KIẾN TRÚC TỔNG THỂ DỰ ÁN (ARCHITECTURE FIRST)

### 1.1. Tổ Chức Thư Mục Theo Tính Năng (Feature-Based Architecture)

Thay vì gom nhóm theo loại file (folder components, folder pages,... cồng kềnh và khó quản lý khi dự án lớn), chúng ta tổ chức dự án hoàn toàn dựa trên các Modules/Features. Kiến trúc được thiết kế hướng đến **dễ mở rộng (Scalable)**, **dễ bảo trì (Maintainable)** và **tách biệt trách nhiệm rõ ràng (Separation of Concerns)**.

```
src/
 ├── main.tsx                          # Entry point duy nhất của ứng dụng
 │
 ├── app/                              # ⚙️ CẤU HÌNH TOÀN CỤC (Global Wiring)
 │    ├── App.tsx                       #    Provider Shell (Redux, Router, Theme...)
 │    ├── store.ts                      #    Redux Store (configureStore)
 │    ├── env.ts                        #    Type-safe Environment Variables
 │    ├── styles/                       #    Global Styles & Theme
 │    │    └── index.css                #      CSS Custom Properties, Animations, Theme Tokens
 │    └── router/                       #    🚦 ROUTING MODULE (tách riêng, dễ mở rộng)
 │         ├── index.tsx                #      Cấu hình routes chính (createBrowserRouter)
 │         ├── guards/                  #      Route Guards (bảo vệ truy cập)
 │         │    ├── ProtectedRoute.tsx   #        Guard yêu cầu đăng nhập
 │         │    ├── GuestRoute.tsx       #        Guard chặn user đã login vào /auth
 │         │    └── RoleGuard.tsx        #        Guard phân quyền theo role (Admin, Doctor...)
 │         └── layouts/                 #      Layout Wrappers (bọc giao diện chung)
 │              ├── SuspenseLayout.tsx   #        Suspense + PageLoader cho lazy routes
 │              ├── MainLayout.tsx       #        Layout chính (Header + Footer + Content)
 │              └── DashboardLayout.tsx  #        Layout dashboard (Sidebar + Content)
 │
 ├── features/                          # 🏗️ CÁC TÍNH NĂNG CÔ LẬP (Feature Modules)
 │    ├── auth/                         #    Feature: Xác thực (Đăng nhập, Đăng ký, OTP)
 │    │    ├── api/                     #      API services chuyên biệt (authService, userService)
 │    │    ├── components/              #      Sub-components UI riêng (LoginForm, RegisterForm)
 │    │    ├── hooks/                   #      Custom hooks riêng (useLoginForm, useRegisterForm)
 │    │    ├── pages/                   #      Smart Page components (AuthPage)
 │    │    ├── store/                   #      Redux Slice (authSlice)
 │    │    ├── types/                   #      Domain types (User, AuthResponse, LoginPayload)
 │    │    └── index.ts                 #      Public API — Barrel Export (Module Boundary)
 │    ├── appointment/                  #    Feature: Đặt lịch khám
 │    ├── patient/                      #    Feature: Quản lý bệnh nhân
 │    └── doctor/                       #    Feature: Quản lý bác sĩ
 │
 ├── shared/                            # 📦 TÀI NGUYÊN DÙNG CHUNG (Shared Resources)
 │    ├── components/                   #    Reusable Components (PageLoader, ErrorFallback)
 │    ├── hooks/                        #    Common Hooks (useDebounce, useMediaQuery)
 │    ├── types/                        #    Common Types (ApiResponse, NormalizedError)
 │    ├── ui/                           #    Atomic UI Components (Button, Input, Modal, Toast)
 │    └── utils/                        #    Utility Functions (axios instance, logger, formatDate)
 │
 └── assets/                            # 🖼️ TÀI NGUYÊN TĨNH (Static Assets)
      └── images/                       #    Hình ảnh (logo, icons, illustrations)
```

#### Giải Thích Kiến Trúc

| Tầng | Thư Mục | Vai Trò | Ví Dụ |
|------|---------|---------|-------|
| **Entry** | `main.tsx` | Điểm khởi chạy duy nhất | Mount React vào DOM |
| **App** | `app/` | Wiring toàn cục — kết nối mọi thứ lại | Store, Router, Providers, Env, Global Styles |
| **App → Router** | `app/router/` | Định tuyến, phân quyền, layout | Routes, Guards, Layouts |
| **Features** | `features/*/` | Nghiệp vụ cô lập theo tính năng | auth, appointment, patient, doctor |
| **Shared** | `shared/` | Tài nguyên dùng chung (≥ 2 features) | PageLoader, ApiResponse, axios, useDebounce |
| **Assets** | `assets/` | File tĩnh (hình ảnh, fonts, icons) | logo_hoan_my.png |

#### Quy Tắc Đặt File Trong `app/`

- `app/` **CHỈ** chứa các file **cấu hình toàn cục** và **wiring** — KHÔNG chứa business logic.
- `app/router/` phải tách rõ: `index.tsx` (config routes) ↔ `guards/` (bảo vệ truy cập) ↔ `layouts/` (giao diện bọc ngoài).
- Khi thêm guard mới (VD: `AdminGuard`), tạo file trong `guards/` — không đặt chung với config.
- Khi thêm layout mới (VD: `DashboardLayout`), tạo file trong `layouts/` — không đặt chung với guards.

### 1.2. Hướng Đi Của Dependencies (Dependency Direction Rules)

Dữ liệu chỉ được import theo chiều **từ ngoài vào trong**, cấm tuyệt đối coupling chéo:

$$\text{main} \longrightarrow \text{app} \longrightarrow \text{features} \longrightarrow \text{shared}$$

| Quy Tắc | Cho Phép | Cấm |
|---------|----------|-----|
| `app/` import từ `features/` | ✅ `import { authReducer } from "../features/auth"` | ❌ Import deep path |
| `app/` import từ `shared/` | ✅ `import PageLoader from "../shared/components/PageLoader"` | — |
| `features/` import từ `shared/` | ✅ `import { ApiResponse } from "../shared/types/common.types"` | — |
| `shared/` import từ `features/` | — | ❌ **CẤM TUYỆT ĐỐI** |
| `feature A` import từ `feature B` | — | ❌ **CẤM** — phải đi qua `shared/` hoặc `app/` |

### 1.3. Khai Báo Public API Cho Các Feature (Module Boundary)

Mỗi feature chỉ được phép export những thành phần công khai thông qua file `index.ts` nằm tại gốc của feature đó (Barrel Export).

```typescript
// features/auth/index.ts — Public API
export { default as authReducer } from "./store/authSlice";
export { authSlice, setCredentials, updateUserInfo, logout } from "./store/authSlice";
export type { User, LoginPayload, AuthResponse } from "./types/auth.types";
```

- **Tốt**: `import { authReducer } from "@/features/auth";`
- **Xấu**: `import authReducer from "@/features/auth/store/authSlice";` (Vi phạm module boundary).

> **⚠️ Lưu ý Code-Splitting**: Các Page components (VD: `AuthPage`) **KHÔNG được export** qua barrel `index.ts` nếu chúng được lazy-load qua `import()` trong router. Nếu export static sẽ phá vỡ code-splitting và tăng bundle size. Page components chỉ được import trực tiếp bằng `import()` trong `app/router/index.tsx`.

### 1.4. Nguyên Tắc Colocation (Đặt File Gần Nơi Sử Dụng)

Đặt file tại vị trí gần nhất với nơi nó được sử dụng. Nếu một component chỉ dùng trong feature `auth`, nó phải nằm trong `features/auth/components/`, không phải `shared/components/`. Chỉ di chuyển lên `shared/` khi có **ít nhất 2 features** cùng sử dụng.

**Quy trình di chuyển file:**

```
Bước 1: File mới → đặt trong feature/ hiện tại
Bước 2: Feature khác cần dùng? → Di chuyển lên shared/
Bước 3: Toàn app cần? → Di chuyển lên app/
```

---

## 2. TIÊU CHUẨN TYPESCRIPT CHẶT CHẼ (STRICT TYPESCRIPT)

### 2.1. Bắt Buộc Kích Hoạt Strict Mode

Trong `tsconfig.json` bắt buộc phải bật:

```json
{
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "forceConsistentCasingInFileNames": true
    }
}
```

### 2.2. Chuẩn Hóa Kiểu Dữ Liệu Gọi API (API Response Envelope)

Sử dụng kiểu dữ liệu Generic để cấu trúc hóa tất cả các API phản hồi từ máy chủ:

```typescript
export interface ApiResponse<T> {
    status: "success" | "error";
    code: number;
    message: string;
    data: T;
}
```

### 2.3. Định Nghĩa Domain Types Riêng Biệt

Toàn bộ kiểu dữ liệu nghiệp vụ (User, Problem, Submission, Session) phải được quản lý tập trung trong folder `src/types/` hoặc `features/*/types/`.

### 2.4. Tránh Type Assertion Không An Toàn

- **CẤM**: `const user = data as User;` (Nếu data là null/undefined sẽ gây lỗi runtime).
- **NÊN**: Sử dụng kiểm tra thuộc tính hoặc Zod Schema để validate trước khi cast kiểu.

### 2.5. Sử Dụng Utility Types Hiệu Quả (DRY Types)

Tận dụng các Utility Types tích hợp sẵn của TypeScript thay vì định nghĩa type trùng lặp:

```typescript
// Sai: Viết lại từng thuộc tính
interface UserUpdate {
    name?: string;
    email?: string;
    avatar?: string;
}

// Đúng: Tái sử dụng từ type gốc
type UserUpdate = Partial<Pick<User, "name" | "email" | "avatar">>;
```

- `Pick<T, K>` — Chọn một số thuộc tính từ type gốc.
- `Omit<T, K>` — Loại bỏ một số thuộc tính.
- `Partial<T>` — Biến tất cả thuộc tính thành optional.
- `Required<T>` — Biến tất cả thành bắt buộc.
- `Record<K, V>` — Tạo object map.
- `ReturnType<T>` — Lấy kiểu trả về của hàm.
- `Readonly<T>` — Đóng băng toàn bộ thuộc tính.

### 2.6. Discriminated Unions & Exhaustive Switch

Sử dụng Discriminated Unions kết hợp kiểm tra toàn diện (exhaustive check) để xử lý mọi trạng thái (state machine):

```typescript
// Định nghĩa Union rõ ràng
type RequestState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; data: Problem[] }
    | { status: "error"; error: string };

// Xử lý tất cả các case — TypeScript sẽ báo lỗi nếu thiếu case
function renderState(state: RequestState): React.ReactNode {
    switch (state.status) {
        case "idle":
            return <IdleView />;
        case "loading":
            return <LoadingSpinner />;
        case "success":
            return <ProblemList data={state.data} />;
        case "error":
            return <ErrorMessage message={state.error} />;
        default: {
            const _exhaustive: never = state;
            throw new Error(`Unhandled state: ${JSON.stringify(_exhaustive)}`);
        }
    }
}
```

### 2.7. Toán Tử `satisfies` (TypeScript 5.x+)

Sử dụng `satisfies` khi cần đảm bảo object phù hợp với type mà vẫn giữ nguyên literal type:

```typescript
const ROUTES = {
    home: "/",
    login: "/auth/login",
    problems: "/problems",
} satisfies Record<string, string>;

// TypeScript vẫn biết ROUTES.home là "/" (literal), không chỉ là string
```

---

## 3. UI/UX COMPONENT STANDARDS (THIẾT KẾ GIAO DIỆN PREMIUM)

### 3.1. Nguyên Tắc Đơn Nhiệm (Single Responsibility Principle)

Mỗi component chỉ làm đúng một nhiệm vụ duy nhất.

- `<ProblemPanel />`: Chỉ nhận đề bài dạng Markdown và render.
- **TRÁNH**: Tích hợp cả gọi API, mở Modal, và kiểm tra phân quyền bên trong một component hiển thị giao diện thuần túy.

### 3.2. Phân Tách Component Thông Minh và Component Giao Diện (Smart vs Dumb Components)

- **Dumb Component (UI Component)**: Nằm ở `shared/ui/`. Không có logic nghiệp vụ, không kết nối Redux Store. Chỉ nhận props hiển thị và truyền sự kiện ra ngoài (ví dụ: `Button`, `Modal`, `InputForm`).
- **Smart Component (Feature Component)**: Nằm ở `features/*/pages/` hoặc `components/`. Kết nối Redux, thực hiện gọi API, xử lý business logic và truyền data xuống Dumb Component.

### 3.3. Quy Tắc Thiết Kế Reusable UI Modals & Elements

- Tất cả các thông báo lỗi, cảnh báo, xác nhận thay thế hoàn toàn `alert()` bằng các Modal Bootstrap được tùy biến giao diện:
    - Sử dụng hiệu ứng **Glassmorphism** (khử mờ background `backdrop-filter: blur(12px)`).
    - Tối ưu màu sắc hiển thị phù hợp với từng trạng thái cảm xúc (Vibrant Emerald cho Success, Deep Rose cho Error, Vivid Gold cho Warning).
    - Áp dụng các micro-animations (hiệu ứng scale mượt mà, fade-in dịu mắt).

### 3.4. Compound Components Pattern (Thay Thế Prop Drilling)

Khi component có nhiều biến thể hoặc cấu trúc phức tạp, sử dụng Compound Components thay vì truyền quá nhiều props:

```typescript
// Xấu: Truyền quá nhiều props
<DataTable
    data={problems}
    columns={columns}
    sortable={true}
    filterable={true}
    pagination={true}
    onSort={handleSort}
    onFilter={handleFilter}
    emptyMessage="No problems found"
/>

// Tốt: Compound Components — dễ đọc, linh hoạt
<DataTable data={problems}>
    <DataTable.Header columns={columns} />
    <DataTable.Body sortable filterable />
    <DataTable.Pagination />
    <DataTable.Empty message="No problems found" />
</DataTable>
```

### 3.5. Props Interface Bắt Buộc Cho Mỗi Component

Mỗi component phải có interface props được đặt tên rõ ràng với hậu tố `Props`:

```typescript
interface ProblemCardProps {
    readonly problem: Problem;
    readonly onSelect: (id: string) => void;
    readonly isActive: boolean;
}

const ProblemCard = ({ problem, onSelect, isActive }: ProblemCardProps) => {
    // ...
};
```

- Sử dụng `readonly` cho props để ngăn chặn mutation vô ý.
- Tránh `React.FC` — khai báo function trực tiếp với typed props để kiểm soát rõ ràng hơn.

---

## 4. QUẢN LÝ TRẠNG THÁI (STATE MANAGEMENT BEST PRACTICES)

### 4.1. Phân Loại Trạng Thái Đúng Vị Trí

- **UI State (Local State)**: Dùng `useState` hoặc `useReducer` trực tiếp trong component (ví dụ: trạng thái đóng/mở sidebar, toggle modal).
- **Feature State (Global State)**: Dùng Redux Toolkit khi dữ liệu cần được chia sẻ giữa nhiều trang hoặc nhiều component ở nhánh khác nhau (ví dụ: `auth` user profile, `currentProblem` trong IDE).
- **Server State**: Sử dụng cơ chế cache API hoặc quản lý trạng thái đồng bộ hóa (ví dụ: RTK Query, Axios Interceptors).

### 4.2. Nguyên Tắc Không Lưu Dữ Liệu Dư Thừa (Computed State / Derived State)

Bất kỳ giá trị nào có thể tính toán được từ các giá trị đã có thì cấm tuyệt đối lưu trữ vào state. Tính toán trực tiếp trong quá trình render.

- **Sai**: Lưu `fullName`, `firstName`, `lastName` vào 3 state riêng biệt.
- **Đúng**: Chỉ lưu `fullName`, tính toán `firstName` khi render:
    ```typescript
    const firstName = fullName ? fullName.split(" ")[0] : "Coder";
    ```
- **Sai**: Sync state bằng `useEffect` (Ví dụ: dùng `useEffect` để cập nhật `filteredList` khi `list` thay đổi).
- **Đúng**: Dùng `useMemo` hoặc tính trực tiếp khi render:
    ```typescript
    const filteredList = useMemo(
        () => problems.filter((p) => p.difficulty === selectedDifficulty),
        [problems, selectedDifficulty],
    );
    ```

### 4.3. Nguyên Tắc Single Source of Truth (Nguồn Sự Thật Duy Nhất)

Mỗi phần dữ liệu chỉ được lưu trữ tại **một nơi duy nhất**. Nếu cần chia sẻ, các component khác phải đọc từ cùng một nguồn (Redux Store, Context, hoặc URL params), không sao chép sang state cục bộ.

---

## 5. TẦNG KẾT NỐI API & XỬ LÝ LỖI (API LAYER & ERROR HANDLING)

### 5.1. Normalization & Axios Interceptors

- Tất cả các kết nối HTTP phải thông qua Axios Instance chung (`axiosConfig.ts`).
- Sử dụng Response Interceptors để tự động bóc tách vỏ bọc envelope thành công (`response.data.data`) trước khi đưa vào Service/Redux.
- Tự động phát hiện lỗi và chuẩn hóa cấu trúc lỗi về dạng:
    ```typescript
    interface NormalizedError {
        message: string;
        code: string;
        status: number;
    }
    ```

### 5.2. Refresh Token Tự Động & HttpOnly Cookie

- Access Token lưu trong bộ nhớ tạm thời hoặc được mã hóa an toàn qua Caesar Cipher + Base64 trước khi đặt tại storage cục bộ.
- Cơ chế làm mới token (/auth/refresh) phải diễn ra ngầm định hoàn toàn và được server quản lý thông qua cơ chế HttpOnly Cookie bảo mật cao để tránh lỗi tấn công XSS/CSRF.

### 5.3. Error Boundary — Chống "Màn Hình Trắng Chết Chóc"

Sử dụng `ErrorBoundary` để bắt lỗi JavaScript trong cây UI và hiển thị giao diện thay thế thân thiện thay vì crash toàn bộ ứng dụng:

```typescript
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="error-fallback">
            <h2>Đã xảy ra lỗi không mong muốn</h2>
            <p>{error.message}</p>
            <button onClick={resetErrorBoundary}>Thử lại</button>
        </div>
    );
}

// Đặt ErrorBoundary tại các vùng rủi ro cao, KHÔNG bọc toàn bộ app
<ErrorBoundary FallbackComponent={ErrorFallback}>
    <ProblemEditor />
</ErrorBoundary>
```

- **Vị trí**: Đặt ErrorBoundary quanh các component phức tạp, bên thứ ba, hoặc thử nghiệm.
- **Monitoring**: Tích hợp Sentry hoặc LogRocket trong `onError` callback để ghi lại lỗi cho đội phát triển.

### 5.4. Try/Catch Cho Async Operations

ErrorBoundary không bắt được lỗi trong `async` code. Luôn bọc các thao tác bất đồng bộ (API call, file I/O) trong `try...catch` và xử lý UI state cục bộ:

```typescript
const handleSubmit = async () => {
    try {
        setLoading(true);
        const result = await submitSolution(problemId, code);
        showAlert("success", "Nộp bài thành công!");
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            showAlert(
                "error",
                error.response?.data?.message ?? "Lỗi kết nối máy chủ",
            );
        } else if (error instanceof Error) {
            showAlert("error", error.message);
        } else {
            showAlert("error", "Đã xảy ra lỗi không xác định");
        }
    } finally {
        setLoading(false);
    }
};
```

---

## 6. QUY TẮC TỐI ƯU HIỆU NĂNG (PERFORMANCE OPTIMIZATION)

### 6.1. Tránh Re-render Lãng Phí (Render Optimization)

- Sử dụng `useMemo` cho các phép toán tính toán nặng (lọc dữ liệu bài học, sắp xếp bài tập).
- Sử dụng `useCallback` cho các hàm callback truyền xuống các Component con được bọc bởi `React.memo` để tránh phá vỡ cơ chế so sánh nông (Shallow Comparison) của props.
- Colocate State: Đặt state ở vị trí gần nơi nó được sử dụng nhất để tránh kích hoạt re-render cả cây thư mục lớn.
- **KHÔNG memoize sớm (Premature Memoization)**: Chỉ tối ưu khi đã đo lường và xác nhận có vấn đề hiệu năng. `useMemo`/`useCallback` không miễn phí — chúng cũng tiêu tốn bộ nhớ.

### 6.2. Code Splitting & Lazy Loading

- Tất cả các Route chính phải được tách bundle động bằng `React.lazy` và được bọc bởi `React.Suspense` kết hợp cùng màn hình chờ tải (Loading Screen) cao cấp.
    ```typescript
    const Dashboard = lazy(
        () => import("@/features/dashboard/pages/Dashboard"),
    );
    ```

### 6.3. Quản Lý Clean-up Hợp Lý

Tất cả các `useEffect` sử dụng `setInterval`, `setTimeout`, các sự kiện của `window.addEventListener`, hoặc các luồng Polling phải có hàm clean-up để hủy kích hoạt khi component bị unmount, tránh rò rỉ bộ nhớ (Memory Leak).

```typescript
useEffect(() => {
    const handleResize = () => {
        /* ... */
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
}, []);
```

### 6.4. Tối Ưu Bundle Size

- Sử dụng **tree-shakeable imports** khi có thể:

    ```typescript
    // Import cả thư viện
    import _ from "lodash";
    _.debounce(fn, 300);

    // Import đúng hàm cần dùng
    import debounce from "lodash/debounce";
    debounce(fn, 300);
    ```

- Định kỳ kiểm tra bundle size bằng `rollup-plugin-visualizer` hoặc `source-map-explorer` để phát hiện các dependencies phình to không cần thiết.
- Tránh import thư viện nặng trong các route ban đầu (ví dụ: code editor chỉ cần load khi vào trang IDE).

---

## 7. CUSTOM HOOKS — NGUYÊN TẮC TỔ HỢP (COMPOSITION PATTERNS)

### 7.1. Đơn Nhiệm Cho Custom Hooks

Mỗi custom hook chỉ nên giải quyết **một vấn đề duy nhất**:

```typescript
// Tốt: Mỗi hook làm một việc
function useDebounce<T>(value: T, delay: number): T {
    /* ... */
}
function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
    /* ... */
}
function useMediaQuery(query: string): boolean {
    /* ... */
}

// Tốt: Tổ hợp nhiều hooks nhỏ thành hook lớn hơn
function useProblemSearch(problems: Problem[]) {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const filtered = useMemo(
        () =>
            problems.filter((p) =>
                p.title.toLowerCase().includes(debouncedQuery.toLowerCase()),
            ),
        [problems, debouncedQuery],
    );

    return { query, setQuery, filtered, isMobile };
}
```

### 7.2. Tránh Custom Hooks "God Object"

Nếu một custom hook trả về hơn **5 giá trị** hoặc quản lý hơn **3 state**, đó là dấu hiệu cần tách nhỏ hơn.

### 7.3. Dependency Array — Sửa Đúng Cách, Không Tắt Rule

- **CẤM**: Disable `react-hooks/exhaustive-deps` để "ngăn effect chạy lại".
- **NÊN**: Nếu effect chạy quá nhiều, refactor logic:
    - Di chuyển function vào bên trong `useEffect`.
    - Sử dụng `useCallback` để ổn định tham chiếu hàm.
    - Nhớ rằng `useState` setter và `useDispatch` có tham chiếu ổn định — không cần đưa vào dependency array.

---

## 8. QUY TẮC ĐẶT TÊN VÀ PHONG CÁCH CODE (NAMING & STYLE GUIDELINES)

### 8.1. Đặt Tên Đồng Bộ (Naming Consistency)

- **Component**: Sử dụng PascalCase (Ví dụ: `ProblemPanel.tsx`, `ConfirmModal.tsx`).
- **React Hooks**: Sử dụng camelCase bắt đầu bằng tiền tố `use` (Ví dụ: `useAuth.ts`, `useAlert.tsx`).
- **Constants**: Sử dụng UPPER_SNAKE_CASE (Ví dụ: `VITE_API_BASE_URL`, `MAX_RETRY_COUNT`).
- **Types/Interfaces**: Sử dụng PascalCase, khuyến khích đặt tên có hậu tố rõ ràng (Ví dụ: `UserResponse`, `ProblemDto`, `TestCase`).
- **Slices/Reducers**: Sử dụng camelCase kết thúc bằng hậu tố `Slice` (Ví dụ: `authSlice.ts`, `problemSlice.ts`).
- **Boolean Variables**: Bắt đầu bằng `is`, `has`, `should`, `can` (Ví dụ: `isLoading`, `hasError`, `shouldRefresh`, `canSubmit`).
- **Event Handlers**: Bắt đầu bằng `handle` cho tên hàm, `on` cho tên props (Ví dụ: `handleClick` trong component, `onClick` khi truyền props).
- **File names**: Sử dụng PascalCase cho components (`ProblemCard.tsx`), camelCase cho utilities (`formatDate.ts`), kebab-case cho CSS (`problem-card.module.css`).

### 8.2. Clean Code Rules

- **Sử dụng Destructuring** cho các tham số Props để code ngắn gọn, rõ ràng:
    ```typescript
    // Tốt
    const UserCard = ({ name, email }: UserCardProps) => {
        /* ... */
    };
    ```
- **No Dead Code**: Bất kỳ biến, import hoặc hàm nào không còn sử dụng phải được xóa bỏ ngay lập tức (sử dụng ESLint rule `no-unused-vars` để giám sát).
- **Import Order**: Thứ tự import từ trên xuống dưới:
    1. React và các thư viện bên thứ ba (react, redux, bootstrap, lucide).
    2. Components của dự án.
    3. Services, slices, utilities.
    4. Styles (CSS/SCSS).
- **Early Return / Guard Clause**: Xử lý các trường hợp ngoại lệ ngay đầu hàm thay vì lồng if/else sâu:

    ```typescript
    // Sai: Lồng sâu khó đọc
    function processUser(user: User | null) {
        if (user) {
            if (user.isActive) {
                if (user.role === "admin") {
                    // logic chính
                }
            }
        }
    }

    // Đúng: Guard Clause — flat và rõ ràng
    function processUser(user: User | null) {
        if (!user) return;
        if (!user.isActive) return;
        if (user.role !== "admin") return;
        // logic chính
    }
    ```

### 8.3. Magic Numbers & Strings — Cấm Dùng Trực Tiếp

Tất cả các giá trị "phép thuật" phải được gán vào hằng số có tên rõ ràng:

```typescript
// Xấu: "magic number"
if (password.length < 8) {
    /* ... */
}
setTimeout(fn, 300);

// Tốt: Hằng số tự giải thích (self-documenting)
const MIN_PASSWORD_LENGTH = 8;
const DEBOUNCE_DELAY_MS = 300;

if (password.length < MIN_PASSWORD_LENGTH) {
    /* ... */
}
setTimeout(fn, DEBOUNCE_DELAY_MS);
```

### 8.4. Nguyên Tắc DRY (Don't Repeat Yourself)

Nếu một đoạn logic xuất hiện **≥ 2 lần**, hãy trích xuất thành hàm tiện ích hoặc custom hook. Nhưng tránh **DRY quá mức** (Wrong Abstraction) — chỉ trích xuất khi logic thực sự giống nhau, không chỉ "trông giống nhau".

### 8.5. Nguyên Tắc YAGNI (You Ain't Gonna Need It)

Không viết code cho chức năng tương lai mà chưa có yêu cầu cụ thể. Viết code tối thiểu cần thiết cho yêu cầu hiện tại, sau đó mở rộng khi thật sự cần.

---

## 9. ACCESSIBILITY — KHẢ NĂNG TIẾP CẬN (a11y)

### 9.1. Semantic HTML Trước Tiên

Luôn ưu tiên sử dụng các thẻ HTML có ngữ nghĩa thay vì `<div>` và `<span>`:

- `<button>` thay vì `<div onClick={...}>`.
- `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>` thay vì `<div>` bọc toàn bộ.
- `<label htmlFor="inputId">` cho mọi input form.

### 9.2. ARIA Attributes Khi Cần

Chỉ sử dụng ARIA khi HTML ngữ nghĩa không đủ để truyền đạt thông tin:

- `aria-label` cho các nút bấm chỉ có icon.
- `aria-live="polite"` cho các vùng nội dung cập nhật động (toast notification, kết quả tìm kiếm).
- `aria-hidden="true"` cho các phần tử trang trí không có ý nghĩa.

### 9.3. Keyboard Navigation

Đảm bảo tất cả các phần tử tương tác đều có thể truy cập bằng bàn phím (Tab, Enter, Escape). Khi mở Modal, focus phải được chuyển vào Modal và "nhốt" bên trong (Focus Trap) cho đến khi đóng.

### 9.4. Contrast & Readability

- Tỷ lệ tương phản màu sắc tối thiểu **4.5:1** cho text thường và **3:1** cho text lớn (WCAG AA).
- Font size tối thiểu **14px** cho nội dung chính.

---

## 10. TESTING — CHIẾN LƯỢC KIỂM THỬ

### 10.1. Testing Trophy (Kent C. Dodds)

Ưu tiên viết test theo mô hình hình "cúp":

```
         /  E2E Tests  \           ← Ít nhất, kiểm thử luồng quan trọng
        / Integration    \         ← Nhiều nhất, kiểm thử các module phối hợp
       /   Unit Tests     \        ← Vừa phải, kiểm thử logic thuần
      /   Static Analysis  \       ← Nền tảng (TypeScript + ESLint)
```

### 10.2. Quy Tắc Viết Test

- **Test hành vi (behavior), KHÔNG test implementation**: Kiểm tra "khi user click nút Submit, form gửi thành công" thay vì "hàm `handleSubmit` được gọi".
- **Arrange → Act → Assert (AAA Pattern)**: Cấu trúc mỗi test case rõ ràng thành 3 phần.
- **Sử dụng `screen` queries theo thứ tự ưu tiên** (React Testing Library):
    1. `getByRole` → 2. `getByLabelText` → 3. `getByPlaceholderText` → 4. `getByText` → 5. `getByTestId` (cuối cùng).
- **Test coverage tối thiểu**: 80% cho logic nghiệp vụ chính (auth flow, submission flow).
- **Mocking**: Chỉ mock ở ranh giới hệ thống (API calls, browser APIs), KHÔNG mock internal modules.

### 10.3. Công Cụ Testing

- **Unit/Integration**: Vitest + React Testing Library.
- **E2E**: Playwright (ưu tiên) hoặc Cypress.
- **Accessibility Audit**: eslint-plugin-jsx-a11y + Lighthouse CI.

---

## 11. BẢO MẬT ỨNG DỤNG (SECURITY MINDSET)

- **XSS Protection**: Cấm tuyệt đối việc sử dụng `dangerouslySetInnerHTML` với dữ liệu do người dùng nhập trực tiếp mà chưa qua xử lý khử độc (Sanitization). Nếu render Markdown, bắt buộc phải thoát (escape) các thẻ `<`, `>` trước khi thực hiện parse.
- **Token Security**: Không lưu trữ các thông tin bảo mật hay dữ liệu riêng tư nhạy cảm của người dùng dưới dạng văn bản thô (Plain Text) tại localStorage. Khuyến khích mã hóa xáo trộn trước khi lưu hoặc chuyển hẳn sang HttpOnly Cookie.
- **Role-Based Access Control (RBAC)**: Thực hiện kiểm tra phân quyền (Student, Teacher, Admin) ở cả cấp độ định tuyến (Route Guard) lẫn cấp độ giao diện (ẩn các nút bấm, chức năng quản lý nếu tài khoản không đủ đặc quyền).
- **Environment Variables**: Tất cả các giá trị cấu hình nhạy cảm (API URL, secret keys) phải được lưu trong `.env` file và KHÔNG BAO GIỜ commit lên Git. Sử dụng tiền tố `VITE_` cho các biến cần expose ra client.
    ```
    # .env.local (KHÔNG commit)
    VITE_API_BASE_URL=https://code.innogenlab.com/api
    ```
- **Dependency Audit**: Định kỳ chạy `npm audit` và cập nhật các thư viện có lỗ hổng bảo mật (CVE). Cấm dùng thư viện đã bị deprecated hoặc không còn được bảo trì.

---

## 12. ENVIRONMENT & CONFIGURATION MANAGEMENT

### 12.1. Phân Tách Môi Trường

```
.env                 # Giá trị mặc định cho mọi môi trường
.env.local           # Ghi đè cho local dev (KHÔNG commit)
.env.development     # Riêng cho development
.env.production      # Riêng cho production
```

### 12.2. Type-safe Environment Variables

Tạo file `src/config/env.ts` để validate và export các biến môi trường với kiểu an toàn:

```typescript
function getEnvVar(key: string): string {
    const value = import.meta.env[key];
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}

export const ENV = {
    API_BASE_URL: getEnvVar("VITE_API_BASE_URL"),
    APP_VERSION: getEnvVar("VITE_APP_VERSION"),
} as const;
```

---

## 13. LOGGING & MONITORING CHUYÊN NGHIỆP

### 13.1. Cấm `console.log` Trong Production

- Sử dụng Vite plugin hoặc cấu hình `esbuild.drop` để tự động loại bỏ `console.log` trong production build.
- Trong development, nếu cần log debug, sử dụng wrapper function có thể tắt theo môi trường:

```typescript
const isDev = import.meta.env.DEV;

export const logger = {
    info: (...args: unknown[]) => {
        if (isDev) console.info("[INFO]", ...args);
    },
    warn: (...args: unknown[]) => {
        if (isDev) console.warn("[WARN]", ...args);
    },
    error: (...args: unknown[]) => {
        console.error("[ERROR]", ...args);
    }, // Error luôn log
};
```

### 13.2. Error Tracking

Tích hợp dịch vụ theo dõi lỗi (Sentry, LogRocket) cho production để nhận được thông báo real-time khi user gặp lỗi. Bao gồm thông tin context (user ID, route, action).

---

## 14. GIÁM SÁT VÀ QUY TRÌNH PHÁT TRIỂN (GIT & CI/CD WORKFLOW)

### 14.1. Commit Message Standard (Conventional Commits)

Tất cả các commit phải tuân thủ đúng định dạng chuẩn để dễ dàng truy vết lịch sử:

- `feat: <mô tả>` - Khi thêm một tính năng mới.
- `fix: <mô tả>` - Khi sửa chữa một lỗi.
- `refactor: <mô tả>` - Khi tái cấu trúc code nhưng không đổi logic (ví dụ: gộp folder, nâng cấp type).
- `docs: <mô tả>` - Khi cập nhật tài liệu hoặc viết tài liệu nguyên tắc.
- `style: <mô tả>` - Khi thay đổi style, căn lề, format (không ảnh hưởng tới logic code).
- `test: <mô tả>` - Khi thêm hoặc sửa test cases.
- `chore: <mô tả>` - Khi cập nhật tooling, config, dependencies.
- `perf: <mô tả>` - Khi cải thiện hiệu năng.

### 14.2. Quy Trình Nhánh (Git Branching Strategy)

- Không push trực tiếp code lên nhánh chính (`main`/`master`).
- Mọi thay đổi đều phải tạo nhánh con rõ ràng:
    - `feature/auth-oauth`
    - `bugfix/explorer-empty`
    - `refactor/api-services-merge`
- Trước khi gộp vào nhánh chính, bắt buộc phải mở **Pull Request**, thực hiện chạy kiểm thử build và có sự phê duyệt (Approve) từ đồng nghiệp/team leader.

### 14.3. Pre-commit Hooks (Husky + lint-staged)

Tự động kiểm tra code trước mỗi commit:

```json
// package.json (lint-staged config)
{
    "lint-staged": {
        "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
        "*.css": ["prettier --write"]
    }
}
```

Đảm bảo không có lỗi TypeScript, ESLint, hoặc format sai khi code được commit.

---

## 15. CODE REVIEW CHECKLIST (DANH SÁCH KIỂM TRA KHI REVIEW CODE)

Trước khi approve bất kỳ Pull Request nào, reviewer phải kiểm tra:

| #   | Tiêu Chí                                                        | Trạng Thái |
| --- | --------------------------------------------------------------- | ---------- |
| 1   | Không có `any`, `@ts-ignore`, `var`, `==`                       | ☐          |
| 2   | Không có `console.log`, dead code, comment thừa                 | ☐          |
| 3   | Không có inline style                                           | ☐          |
| 4   | Component ≤ 200 dòng                                            | ☐          |
| 5   | Tất cả `useEffect` có dependency array hợp lý                   | ☐          |
| 6   | State không bị mutate trực tiếp                                 | ☐          |
| 7   | API errors được xử lý với try/catch + user-friendly message     | ☐          |
| 8   | Không có magic numbers/strings                                  | ☐          |
| 9   | Import order chuẩn (3rd party → components → services → styles) | ☐          |
| 10  | Guard clauses được sử dụng thay vì nested if/else               | ☐          |
| 11  | Props interface có `readonly` và tên rõ ràng                    | ☐          |
| 12  | Key trong list render sử dụng unique ID                         | ☐          |
| 13  | Clean-up function trong useEffect cho timers/listeners          | ☐          |
| 14  | Semantic HTML và a11y attributes khi cần                        | ☐          |
| 15  | Build production thành công, không có warning                   | ☐          |

---

> **Lưu ý cuối**: Tài liệu này là **living document** — sẽ được cập nhật liên tục khi dự án phát triển và khi có các best practices mới từ cộng đồng. Mọi đề xuất thay đổi phải được thảo luận và đồng thuận trong team trước khi cập nhật.
