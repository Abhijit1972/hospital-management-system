import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Scanner;

/**
 * JDBC front end for the Hospital Management System database.
 *
 * Function 1: addPatient()           -> INSERT  (registers a new patient)
 * Function 2: viewAdmittedPatients() -> DISPLAY (lists patients currently admitted,
 *                                       using the vw_admission_details view)
 */
public class HospitalJDBC {

    // ---------- CHANGE THESE THREE LINES FOR YOUR SYSTEM ----------
    static final String URL  = "jdbc:mysql://localhost:3306/hospital_management_system";
    static final String USER = "root";
    static final String PASS = "25BYB0076";
    // For Oracle use: "jdbc:oracle:thin:@localhost:1521:xe" (and your Oracle user/password)
    // ---------------------------------------------------------------

    // Opens a connection to the database
    static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASS);
    }

    // ===================== FUNCTION 1 : INSERT =====================
    static void addPatient(String name, String gender, String dob,
                           String bloodGroup, String phone, String address) {
        String sql = "INSERT INTO Patients "
                   + "(patient_name, gender, dob, blood_group, phone, address) "
                   + "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, name);
            ps.setString(2, gender);                       // Male / Female / Other
            ps.setDate(3, java.sql.Date.valueOf(dob));     // format: yyyy-MM-dd
            ps.setString(4, bloodGroup);
            ps.setString(5, phone);
            ps.setString(6, address);

            int rows = ps.executeUpdate();
            System.out.println(rows + " patient added successfully.");

        } catch (IllegalArgumentException e) {
            System.out.println("Invalid date. Use the format yyyy-MM-dd (e.g. 1999-05-14).");
        } catch (SQLException e) {
            System.out.println("Could not add patient: " + e.getMessage());
        }
    }

    // ===================== FUNCTION 2 : DISPLAY =====================
    static void viewAdmittedPatients() {
        String sql = "SELECT admission_id, patient_name, doctor_name, room_no, "
                   + "room_type, admission_date "
                   + "FROM vw_admission_details WHERE status = 'Admitted'";

        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            System.out.printf("%-6s %-18s %-18s %-8s %-13s %-12s%n",
                    "ID", "Patient", "Doctor", "Room", "Room Type", "Admitted On");
            System.out.println("-------------------------------------------------------------------------------");

            boolean found = false;
            while (rs.next()) {
                found = true;
                System.out.printf("%-6d %-18s %-18s %-8s %-13s %-12s%n",
                        rs.getInt("admission_id"),
                        rs.getString("patient_name"),
                        rs.getString("doctor_name"),
                        rs.getString("room_no"),
                        rs.getString("room_type"),
                        rs.getDate("admission_date"));
            }
            if (!found) {
                System.out.println("No patients are currently admitted.");
            }

        } catch (SQLException e) {
            System.out.println("Could not fetch admissions: " + e.getMessage());
        }
    }

    // ===================== SIMPLE MENU =====================
    public static void main(String[] args) {
        try (Connection con = getConnection()) {
            System.out.println("Connected to: " + con.getMetaData().getURL());
        } catch (SQLException e) {
            System.out.println("Connection failed: " + e.getMessage());
            return;
        }

        Scanner sc = new Scanner(System.in);
        while (true) {
            System.out.println("\n=== Hospital Management System ===");
            System.out.println("1. Add a new patient");
            System.out.println("2. View currently admitted patients");
            System.out.println("3. Exit");
            System.out.print("Enter choice: ");
            String choice = sc.nextLine().trim();

            if (choice.equals("1")) {
                System.out.print("Name: ");
                String name = sc.nextLine();
                System.out.print("Gender (Male/Female/Other): ");
                String gender = sc.nextLine();
                System.out.print("Date of birth (yyyy-MM-dd): ");
                String dob = sc.nextLine();
                System.out.print("Blood group (e.g. B+): ");
                String bg = sc.nextLine();
                System.out.print("Phone: ");
                String phone = sc.nextLine();
                System.out.print("Address: ");
                String address = sc.nextLine();
                addPatient(name, gender, dob, bg, phone, address);
            } else if (choice.equals("2")) {
                viewAdmittedPatients();
            } else if (choice.equals("3")) {
                System.out.println("Goodbye.");
                break;
            } else {
                System.out.println("Invalid choice, try again.");
            }
        }
        sc.close();
    }
}
